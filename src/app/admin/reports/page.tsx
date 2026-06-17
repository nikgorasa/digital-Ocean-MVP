"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import {
  BarChart3, Download, Filter, Calendar, TrendingUp, TrendingDown,
  CreditCard, Package, Plane, Building2, DollarSign, FileText, Tag
} from "lucide-react";
import { formatCurrency } from "@/lib";

interface BookingRow {
  id: string;
  type: string;
  rawType: string;
  itemName: string;
  providerOrAirline: string;
  price: number;
  originalPrice: number;
  discountApplied: number;
  promoCost: number;
  couponCodeUsed: string;
  status: string;
  pnr: string;
  seatOrRoom: string;
  paxCount: number;
  travelDates: string;
  bookedAt: string;
  paymentStatus: string;
  leadGuestPan: string;
  userName: string;
  userEmail: string;
  paymentMethod: string;
  costPrice: number;
  markup: number;
  markupPercent: number;
  customerPays: number;
  netEarnings: number;
  marginPercent: number;
}

interface ReportData {
  bookings: BookingRow[];
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalCost: number;
    totalMarkup: number;
    totalDiscount: number;
    totalPromoCost: number;
    totalNetEarnings: number;
    cancelledBookings: number;
    cancelledRevenue: number;
    avgBookingValue: number;
    avgMargin: number;
  };
  byType: { type: string; count: number; revenue: number; cost: number; markup: number; discount: number; promoCost: number; netEarnings: number }[];
  paymentMethods: { method: string; count: number; total: number }[];
  promoUsage: { code: string; count: number; totalDiscount: number; totalRevenue: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "cancellations" | "by-type" | "promos">("overview");

  const tableWrapRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab !== "bookings") return;
    const wrap = tableWrapRef.current;
    const top = topScrollRef.current;
    if (!wrap || !top) return;

    const ghost = top.firstElementChild as HTMLElement | null;
    const table = wrap.querySelector("table");

    const syncWidth = () => {
      if (ghost && table) ghost.style.width = `${table.scrollWidth}px`;
    };
    syncWidth();

    const ro = table ? new ResizeObserver(syncWidth) : null;
    if (ro && table) ro.observe(table);

    const bottom = wrap;
    const onTopScroll = () => { bottom.scrollLeft = top.scrollLeft; };
    const onBottomScroll = () => { top.scrollLeft = bottom.scrollLeft; };
    top.addEventListener("scroll", onTopScroll);
    bottom.addEventListener("scroll", onBottomScroll);

    return () => {
      if (ro) ro.disconnect();
      top.removeEventListener("scroll", onTopScroll);
      bottom.removeEventListener("scroll", onBottomScroll);
    };
  }, [activeTab, data]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) { params.set("startDate", startDate); params.set("endDate", endDate); }
      else { params.set("period", period); }
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/reports?${params}`);
      if (res.ok) setData(await res.json());
    } catch (err) { console.error("Failed to fetch report:", err); }
    finally { setLoading(false); }
  }, [period, typeFilter, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportCSV = () => {
    if (!data) return;
    const headers = ["Date", "Type", "Item", "Customer", "Cost Price (TBO)", "Selling Price", "Original Price", "Markup %", "Discount (Admin)", "Promo Cost", "Customer Pays", "Net Earnings", "Margin %", "Status", "Payment"];
    const rows = data.bookings.map((b) => [
      new Date(b.bookedAt).toLocaleDateString("en-IN"), b.type, b.itemName, b.userName,
      b.costPrice, b.price, b.originalPrice || b.price, b.markupPercent + "%", b.discountApplied || 0, b.promoCost || 0,
      b.customerPays, b.netEarnings, b.marginPercent + "%", b.status, b.paymentMethod
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `sales-register-${period}-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    if (type === "HOTEL") return <Building2 size={16} className="text-blue-500" />;
    if (type === "FLIGHT") return <Plane size={16} className="text-green-500" />;
    return <Package size={16} className="text-purple-500" />;
  };

  const getTypeColor = (type: string) => {
    if (type === "HOTEL") return "bg-blue-50 text-blue-700 border-blue-100";
    if (type === "FLIGHT") return "bg-green-50 text-green-700 border-green-100";
    return "bg-purple-50 text-purple-700 border-purple-100";
  };

  const s = data?.summary;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            Sales & Booking Register
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cost Price (TBO) • Selling • Markup • Admin Discount • Promo Cost • Net Earnings</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 cursor-pointer">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select value={period} onChange={(e) => { setPeriod(e.target.value); setStartDate(""); setEndDate(""); }} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="quarterly">Quarterly (3M)</option>
              <option value="halfyearly">Half-Yearly (6M)</option>
              <option value="annual">Annual (YTD)</option>
            </select>
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Types</option>
            <option value="HOTEL">Hotels</option>
            <option value="FLIGHT">Flights</option>
            <option value="PACKAGE">Packages</option>
          </select>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            <span className="text-slate-400">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
      ) : data ? (
        <>
          {/* Summary Cards — Cost / Selling / Admin Discount / Promo / Earnings */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Total Bookings</p>
              <p className="text-2xl font-bold text-slate-900">{s?.totalBookings || 0}</p>
              <p className="text-xs text-slate-400">Avg: {formatCurrency(s?.avgBookingValue || 0)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl p-5 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Cost Price (TBO)</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(s?.totalCost || 0)}</p>
              <p className="text-xs text-slate-400">What we pay TBO</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Selling Price</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(s?.totalRevenue || 0)}</p>
              <p className="text-xs text-slate-400">What customer pays</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-5 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Discount (Admin)</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(s?.totalDiscount || 0)}</p>
              <p className="text-xs text-slate-400">Corporate discount</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-white rounded-2xl p-5 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Promo Cost</p>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(s?.totalPromoCost || 0)}</p>
              <p className="text-xs text-slate-400">Coupon code discounts</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50">
              <p className="text-xs text-emerald-600 mb-1">Net Earnings</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(s?.totalNetEarnings || 0)}</p>
              <p className="text-xs text-emerald-500">{s?.avgMargin || 0}% avg margin</p>
            </motion.div>
          </div>

          {/* Price Flow Visualization */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Price Flow</h3>
            <div className="flex items-center gap-2 text-sm flex-wrap justify-center">
              <div className="text-center p-3 bg-red-50 rounded-xl min-w-[100px]">
                <p className="text-xs text-red-500">Cost (TBO)</p>
                <p className="font-bold text-red-700">{formatCurrency(s?.totalCost || 0)}</p>
              </div>
              <span className="text-slate-400">+</span>
              <div className="text-center p-3 bg-blue-50 rounded-xl min-w-[100px]">
                <p className="text-xs text-blue-500">Markup</p>
                <p className="font-bold text-blue-700">{formatCurrency(s?.totalMarkup || 0)}</p>
              </div>
              <span className="text-slate-400">=</span>
              <div className="text-center p-3 bg-slate-50 rounded-xl min-w-[100px]">
                <p className="text-xs text-slate-500">Original Price</p>
                <p className="font-bold text-slate-900">{formatCurrency((s?.totalRevenue || 0) + (s?.totalDiscount || 0) + (s?.totalPromoCost || 0))}</p>
              </div>
              <span className="text-slate-400">−</span>
              <div className="text-center p-3 bg-orange-50 rounded-xl min-w-[100px]">
                <p className="text-xs text-orange-500">Discount (Admin)</p>
                <p className="font-bold text-orange-700">{formatCurrency(s?.totalDiscount || 0)}</p>
              </div>
              <span className="text-slate-400">−</span>
              <div className="text-center p-3 bg-rose-50 rounded-xl min-w-[100px]">
                <p className="text-xs text-rose-500">Promo Cost</p>
                <p className="font-bold text-rose-700">{formatCurrency(s?.totalPromoCost || 0)}</p>
              </div>
              <span className="text-slate-400">=</span>
              <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-200 min-w-[100px]">
                <p className="text-xs text-emerald-500">Net Earnings</p>
                <p className="font-bold text-emerald-700">{formatCurrency(s?.totalNetEarnings || 0)}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["overview", "bookings", "cancellations", "by-type", "promos"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${activeTab === tab ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                {tab === "overview" ? "Overview" : tab === "bookings" ? "All Bookings" : tab === "cancellations" ? "Cancellations" : tab === "by-type" ? "By Type" : "Promo Usage"}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Revenue by Type</h3>
                <div className="space-y-3">
                  {data.byType.map((t) => (
                    <div key={t.type} className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(t.type)}
                          <span className="font-medium text-slate-900 text-sm">{t.type}</span>
                          <span className="text-xs text-slate-400">{t.count} bookings</span>
                        </div>
                        <span className="font-bold text-slate-900">{formatCurrency(t.netEarnings)}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div><span className="text-slate-400">Cost</span><p className="font-medium text-red-600">{formatCurrency(t.cost)}</p></div>
                        <div><span className="text-slate-400">Selling</span><p className="font-medium text-blue-600">{formatCurrency(t.revenue)}</p></div>
                        <div><span className="text-slate-400">Discount</span><p className="font-medium text-orange-600">{formatCurrency(t.discount)}</p></div>
                        <div><span className="text-slate-400">Promo</span><p className="font-medium text-rose-600">{formatCurrency(t.promoCost)}</p></div>
                        <div><span className="text-slate-400">Net</span><p className="font-medium text-emerald-600">{formatCurrency(t.netEarnings)}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Payment Methods</h3>
                {data.paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {data.paymentMethods.map((p) => (
                      <div key={p.method} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3"><CreditCard size={16} className="text-slate-400" /><span className="font-medium text-sm capitalize">{p.method}</span><span className="text-xs text-slate-400">{p.count} txns</span></div>
                        <span className="font-bold">{formatCurrency(p.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400 text-center py-4">No payment data</p>}
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden" style={{ height: 14 }}>
                <div style={{ height: 1 }} />
              </div>
              <div ref={tableWrapRef} className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="sticky left-0 bg-slate-50 z-10 px-3 py-3 text-left font-bold text-slate-600">Date</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Type</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Item</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Customer</th>
                        <th className="px-3 py-3 text-right font-bold text-slate-600">Cost (TBO)</th>
                        <th className="px-3 py-3 text-right font-bold text-slate-600">Selling</th>
                        <th className="px-3 py-3 text-right font-bold text-slate-600">Markup</th>
                        <th className="px-3 py-3 text-right font-bold text-orange-500">Disc.</th>
                        <th className="px-3 py-3 text-right font-bold text-rose-500">Promo</th>
                        <th className="px-3 py-3 text-right font-bold text-emerald-600">Net Earnings</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bookings.map((b) => (
                        <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="sticky left-0 bg-white z-10 px-3 py-3 text-slate-600 text-xs">{new Date(b.bookedAt).toLocaleDateString("en-IN")}</td>
                          <td className="px-3 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeColor(b.type)}`}>{b.type}</span></td>
                          <td className="px-3 py-3 text-slate-900 font-medium max-w-[150px] truncate text-xs">{b.itemName}</td>
                          <td className="px-3 py-3"><p className="text-slate-900 text-xs">{b.userName}</p></td>
                          <td className="px-3 py-3 text-right text-red-600 text-xs">{formatCurrency(b.costPrice)}</td>
                          <td className="px-3 py-3 text-right text-blue-600 text-xs font-medium">{formatCurrency(b.price)}</td>
                          <td className="px-3 py-3 text-right text-xs"><span className="text-slate-600">{formatCurrency(b.markup)}</span><span className="text-slate-400 ml-1">({b.markupPercent}%)</span></td>
                          <td className="px-3 py-3 text-right text-orange-600 text-xs">{b.discountApplied ? `-${formatCurrency(b.discountApplied)}` : "—"}</td>
                          <td className="px-3 py-3 text-right text-xs">
                            {b.promoCost > 0 ? (
                              <span className="text-rose-600">-{formatCurrency(b.promoCost)}<span className="text-slate-400 ml-1 font-mono text-[10px]">{b.couponCodeUsed}</span></span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-emerald-600 text-xs">{formatCurrency(b.netEarnings)}</td>
                          <td className="px-3 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
              {data.bookings.length === 0 && <div className="text-center py-12 text-slate-400"><FileText size={40} className="mx-auto mb-3 text-slate-300" /><p>No bookings found</p></div>}
            </div>
          )}

          {/* Cancellations Tab */}
          {activeTab === "cancellations" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {data.bookings.filter((b) => b.status === "CANCELLED").length === 0 ? (
                <div className="text-center py-12"><TrendingUp size={40} className="mx-auto mb-3 text-green-300" /><p className="text-green-600 font-medium">No cancellations</p><p className="text-sm text-slate-400 mt-1">{s?.totalBookings || 0} bookings confirmed</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-red-50 border-b border-red-100">
                      <th className="px-4 py-3 text-left font-bold text-red-700">Date</th>
                      <th className="px-4 py-3 text-left font-bold text-red-700">Type</th>
                      <th className="px-4 py-3 text-left font-bold text-red-700">Item</th>
                      <th className="px-4 py-3 text-left font-bold text-red-700">Customer</th>
                      <th className="px-4 py-3 text-right font-bold text-red-700">Cost Lost</th>
                      <th className="px-4 py-3 text-right font-bold text-red-700">Revenue Lost</th>
                      <th className="px-4 py-3 text-right font-bold text-rose-600">Promo Lost</th>
                    </tr></thead>
                    <tbody>
                      {data.bookings.filter((b) => b.status === "CANCELLED").map((b) => (
                        <tr key={b.id} className="border-b border-slate-100 hover:bg-red-50">
                          <td className="px-4 py-3 text-slate-600">{new Date(b.bookedAt).toLocaleDateString("en-IN")}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getTypeColor(b.type)}`}>{b.type}</span></td>
                          <td className="px-4 py-3 text-slate-900 font-medium">{b.itemName}</td>
                          <td className="px-4 py-3">{b.userName}</td>
                          <td className="px-4 py-3 text-right text-red-600">{formatCurrency(b.costPrice)}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(b.price)}</td>
                          <td className="px-4 py-3 text-right text-rose-600">{b.promoCost > 0 ? formatCurrency(b.promoCost) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* By Type Tab */}
          {activeTab === "by-type" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.byType.map((t) => (
                <div key={t.type} className="bg-white rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">{getTypeIcon(t.type)}<h3 className="font-bold text-slate-900">{t.type}</h3><span className="text-xs text-slate-400">{t.count}</span></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Cost Price (TBO)</span><span className="font-medium text-red-600">{formatCurrency(t.cost)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Selling Price</span><span className="font-medium text-blue-600">{formatCurrency(t.revenue)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Markup</span><span className="font-medium text-slate-700">{formatCurrency(t.markup)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Discount (Admin)</span><span className="font-medium text-orange-600">{formatCurrency(t.discount)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Promo Cost</span><span className="font-medium text-rose-600">{formatCurrency(t.promoCost)}</span></div>
                    <div className="border-t pt-2 flex justify-between text-sm"><span className="font-bold text-slate-700">Net Earnings</span><span className="font-bold text-emerald-600">{formatCurrency(t.netEarnings)}</span></div>
                    <div className="flex justify-between text-xs text-slate-400"><span>Margin</span><span>{t.revenue > 0 ? Math.round((t.netEarnings / t.revenue) * 100) : 0}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Promos Tab */}
          {activeTab === "promos" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {data.promoUsage.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Promo Code</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-600">Used</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-600">Total Discount</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-600">Revenue</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-600">Avg Discount/Booking</th>
                    </tr></thead>
                    <tbody>
                      {data.promoUsage.map((p) => (
                        <tr key={p.code} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.code}</td>
                          <td className="px-4 py-3 text-right">{p.count}</td>
                          <td className="px-4 py-3 text-right text-orange-600 font-medium">{formatCurrency(p.totalDiscount)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(p.totalRevenue)}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(p.totalDiscount / (p.count || 1))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="text-center py-12 text-slate-400"><Tag size={40} className="mx-auto mb-3 text-slate-300" /><p>No promo codes used in this period</p></div>}
            </div>
          )}
        </>
      ) : <div className="text-center py-12 text-slate-400"><BarChart3 size={40} className="mx-auto mb-3 text-slate-300" /><p>No data available</p></div>}
    </div>
  );
}
