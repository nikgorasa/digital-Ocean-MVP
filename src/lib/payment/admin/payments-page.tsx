"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CreditCard, CheckCircle, XCircle, Clock, Search, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib";

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: string;
  gateway: string;
  orderId: string | null;
  paymentId: string | null;
  failureReason: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      setPayments(data || []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = filter === "ALL" ? payments : payments.filter((p) => p.status === filter);

  const stats = {
    total: payments.length,
    completed: payments.filter((p) => p.status === "COMPLETED").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    failed: payments.filter((p) => p.status === "FAILED").length,
    totalRevenue: payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Payments</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-slate-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          <p className="text-xs text-slate-500">Failed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-brand-saffron">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-xs text-slate-500">Revenue</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["ALL", "COMPLETED", "PENDING", "FAILED", "REFUNDED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              filter === s
                ? "bg-brand-saffron text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Booking</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Gateway</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment ID</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment, i) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {payment.bookingId.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                      {payment.gateway}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[payment.status] || "bg-slate-100 text-slate-600"}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {payment.paymentId || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(payment.createdAt)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No payments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
