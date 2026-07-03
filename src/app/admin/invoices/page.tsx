"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileText, Filter, Calendar, Building2, CheckCircle, Clock, AlertTriangle, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib";

interface Invoice {
  id: string;
  number: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  issuedAt: string;
  paidAt: string | null;
  paidAmount: number | null;
  paymentRef: string | null;
  notes: string | null;
  company: { id: string; name: string };
  booking: { id: string; type: string; itemName: string; pnr: string | null };
}

interface InvoiceStats {
  totalInvoiced: number;
  totalInvoices: number;
  totalCollected: number;
  pendingCount: number;
  overdueCount: number;
  pendingAmount: number;
  overdueAmount: number;
  byStatus: { status: string; _count: number; _sum: { totalAmount: number | null } }[];
  byCompany: { companyId: string; companyName: string; _count: number; _sum: { totalAmount: number | null } }[];
}

interface Company {
  id: string;
  name: string;
}

const QUICK_RANGES = [
  { label: "This Month", value: "this_month" },
  { label: "Last 30 Days", value: "last_30" },
  { label: "Last 90 Days", value: "last_90" },
  { label: "This Year", value: "this_year" },
  { label: "Custom", value: "custom" },
];

function getDateRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  switch (preset) {
    case "this_month":
      return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, end };
    case "last_30": {
      const d = new Date(now.getTime() - 30 * 86400000);
      return { start: d.toISOString().split("T")[0], end };
    }
    case "last_90": {
      const d = new Date(now.getTime() - 90 * 86400000);
      return { start: d.toISOString().split("T")[0], end };
    }
    case "this_year":
      return { start: `${now.getFullYear()}-01-01`, end };
    default:
      return { start: "", end: "" };
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (statusFilter) params.set("status", statusFilter);
      if (companyFilter) params.set("companyId", companyFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const [invRes, statsRes] = await Promise.all([
        fetch(`/api/invoices?${params}`),
        fetch(`/api/invoices/stats?${params}`),
      ]);

      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data.invoices || []);
        setTotal(data.total || 0);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter, companyFilter, page]);

  useEffect(() => {
    fetch(`/api/companies`).then((r) => r.json()).then((d) => setCompanies(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (datePreset !== "custom") {
      const range = getDateRange(datePreset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  }, [datePreset]);

  useEffect(() => {
    setPage(1);
    fetchInvoices();
  }, [fetchInvoices]);

  const handleMarkPaid = async (id: string) => {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      fetchInvoices();
    } catch (err) {
      console.error("Failed to mark paid:", err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const statusColor = (s: string) => {
    switch (s) {
      case "PAID": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-amber-100 text-amber-700";
      case "OVERDUE": return "bg-red-100 text-red-700";
      case "CANCELLED": return "bg-slate-100 text-slate-500";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  const daysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / 86400000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">Manage corporate invoices and settlements</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-blue-500" />
              <span className="text-xs font-medium text-slate-500">Total Invoiced</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalInvoiced)}</p>
            <p className="text-xs text-slate-400">{stats.totalInvoices} invoices</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-xs font-medium text-slate-500">Collected</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalCollected)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-amber-500" />
              <span className="text-xs font-medium text-slate-500">Pending</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.pendingAmount)}</p>
            <p className="text-xs text-slate-400">{stats.pendingCount} invoices</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-xs font-medium text-slate-500">Overdue</span>
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</p>
            <p className="text-xs text-slate-400">{stats.overdueCount} invoices</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Date Range:</span>
          </div>
          <div className="flex gap-1">
            {QUICK_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDatePreset(r.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  datePreset === r.value
                    ? "bg-brand-saffron text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {datePreset === "custom" && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* By Company breakdown */}
      {stats && stats.byCompany.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">By Company</h3>
          <div className="space-y-2">
            {stats.byCompany.map((c) => (
              <div key={c.companyId} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{c.companyName}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(c._sum.totalAmount || 0)}</span>
                  <span className="text-xs text-slate-400 ml-2">({c._count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Invoice</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Company</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Booking</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Amount</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Due Date</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No invoices found</td></tr>
              ) : (
                invoices.map((inv) => {
                  const days = daysUntilDue(inv.dueDate);
                  return (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-slate-900">{inv.number}</span>
                        <p className="text-xs text-slate-400">{new Date(inv.issuedAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">{inv.company.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{inv.booking.itemName}</span>
                        <p className="text-xs text-slate-400">{inv.booking.type} {inv.booking.pnr && `• ${inv.booking.pnr}`}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs ${days < 0 ? "text-red-600 font-bold" : days <= 7 ? "text-amber-600" : "text-slate-500"}`}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inv.status === "PENDING" && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="text-xs font-medium text-green-600 hover:text-green-700 cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">{total} total invoices</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
