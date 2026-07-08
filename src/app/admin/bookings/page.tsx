"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib";
import {
  Search, X, Building2, Plane, Package, Ticket, Mail,
  Calendar, DollarSign, User, Hash, CreditCard, Clock, Info,
} from "lucide-react";

interface BookingItem {
  id: string;
  userId: string;
  type: string;
  itemName: string;
  providerOrAirline: string | null;
  price: number;
  originalPrice: number | null;
  discountApplied: number;
  promoCost: number;
  couponCodeUsed: string | null;
  status: string;
  pnr: string | null;
  seatOrRoom: string | null;
  leadGuestPan: string | null;
  paxCount: number;
  travelDates: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  bookedAt: string;
  confirmedAt: string | null;
  expiresAt: string | null;
  supplierBookingRef: string | null;
  validatedPrice: number | null;
  priceChangeAmount: number | null;
  companyId: string | null;
  corporateDiscount: number;
  metadata: Record<string, unknown> | null;
  user: { id: string; name: string; email: string };
  payment: { id: string; amount: number; status: string; method: string } | null;
}

interface Stats {
  totalRevenue: number;
  totalBookings: number;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  REFUNDED: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  HOTEL: <Building2 size={16} className="text-blue-500" />,
  FLIGHT: <Plane size={16} className="text-cyan-500" />,
  PACKAGE: <Package size={16} className="text-purple-500" />,
};

const TYPE_OPTIONS = ["ALL", "HOTEL", "FLIGHT", "PACKAGE"];
const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "CANCELLED"];
const PAYMENT_STATUS_OPTIONS = ["ALL", "PENDING", "PAID", "REFUNDED", "FAILED"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const limit = 20;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (paymentFilter !== "ALL") params.set("paymentStatus", paymentFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch bookings");
      }
      const data = await res.json();
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
      setStats(data.stats || { totalRevenue: 0, totalBookings: 0 });
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, paymentFilter, page]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter, paymentFilter]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-saffron" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Bookings</h1>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item name, PNR, provider, or customer..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-saffron/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o} value={o}>{o === "ALL" ? "All Types" : o.charAt(0) + o.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o} value={o}>{o === "ALL" ? "All Status" : o.charAt(0) + o.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
        >
          {PAYMENT_STATUS_OPTIONS.map((o) => (
            <option key={o} value={o}>{o === "ALL" ? "All Payments" : o.charAt(0) + o.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Bookings", value: stats.totalBookings, icon: Ticket, color: "text-blue-600" },
          { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-green-600" },
          { label: "Filtered Count", value: total, icon: Hash, color: "text-slate-900" },
          { label: "Page", value: `${page} of ${totalPages || 1}`, icon: Clock, color: "text-purple-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <Info size={16} />
            {error}
          </div>
          <button
            onClick={fetchBookings}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Bookings Table */}
      {bookings.length === 0 && !error ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Ticket size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">No bookings found</h2>
          <p className="text-slate-500">
            {search ? "Try a different search term" : "No bookings have been made yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Booking</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Price</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, i) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedBooking(booking)}
                      className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0 max-w-[280px]">
                          {TYPE_ICONS[booking.type] || <Ticket size={16} className="text-slate-400" />}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{booking.itemName}</p>
                            {booking.pnr && (
                              <p className="text-xs font-mono text-slate-400">{booking.pnr}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0 max-w-[200px]">
                          <p className="text-slate-900 truncate">{booking.user.name}</p>
                          <p className="text-xs text-slate-400 truncate">{booking.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {TYPE_ICONS[booking.type] || <Ticket size={14} className="text-slate-400" />}
                          <span className="text-xs text-slate-500">{booking.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatCurrency(booking.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[booking.status] || "bg-slate-100 text-slate-600"}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[booking.paymentStatus] || "bg-slate-100 text-slate-600"}`}>
                            {booking.paymentStatus}
                          </span>
                          {booking.paymentMethod && (
                            <span className="text-[10px] text-slate-400">{booking.paymentMethod}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(booking.bookedAt)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl disabled:opacity-30 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedBooking(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl border border-slate-200"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  {TYPE_ICONS[selectedBooking.type] || <Ticket size={24} className="text-slate-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-slate-900 truncate">{selectedBooking.itemName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedBooking.pnr && (
                      <span className="font-mono text-xs text-slate-500">PNR: {selectedBooking.pnr}</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedBooking.status] || "bg-slate-100 text-slate-600"}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Info */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <User size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Customer</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedBooking.user.name}</p>
                  <p className="text-xs text-slate-500">{selectedBooking.user.email}</p>
                </div>

                {/* Booking Info */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <Info size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Details</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type</span>
                      <span className="font-medium text-slate-900">{selectedBooking.type}</span>
                    </div>
                    {selectedBooking.providerOrAirline && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Provider</span>
                        <span className="font-medium text-slate-900">{selectedBooking.providerOrAirline}</span>
                      </div>
                    )}
                    {selectedBooking.seatOrRoom && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Room/Seat</span>
                        <span className="font-medium text-slate-900">{selectedBooking.seatOrRoom}</span>
                      </div>
                    )}
                    {selectedBooking.paxCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pax</span>
                        <span className="font-medium text-slate-900">{selectedBooking.paxCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <DollarSign size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Price Breakdown</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {selectedBooking.originalPrice != null && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Original</span>
                        <span className="font-medium text-slate-700">{formatCurrency(selectedBooking.originalPrice)}</span>
                      </div>
                    )}
                    {selectedBooking.discountApplied > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Discount</span>
                        <span className="font-medium text-green-600">-{formatCurrency(selectedBooking.discountApplied)}</span>
                      </div>
                    )}
                    {selectedBooking.promoCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Promo</span>
                        <span className="font-medium text-green-600">-{formatCurrency(selectedBooking.promoCost)}</span>
                      </div>
                    )}
                    {selectedBooking.couponCodeUsed && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Coupon</span>
                        <span className="font-medium text-slate-900 font-mono">{selectedBooking.couponCodeUsed}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-1.5 mt-1.5 flex justify-between">
                      <span className="font-bold text-slate-700">Net Price</span>
                      <span className="font-bold text-slate-900">{formatCurrency(selectedBooking.price)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <CreditCard size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Payment</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[selectedBooking.paymentStatus] || "bg-slate-100 text-slate-600"}`}>
                        {selectedBooking.paymentStatus}
                      </span>
                    </div>
                    {selectedBooking.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method</span>
                        <span className="font-medium text-slate-900">{selectedBooking.paymentMethod}</span>
                      </div>
                    )}
                    {selectedBooking.payment && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Amount</span>
                          <span className="font-medium text-slate-900">{formatCurrency(selectedBooking.payment.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pay Status</span>
                          <span className="font-medium text-slate-900">{selectedBooking.payment.status}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Timeline</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Booked</span>
                      <span className="font-medium text-slate-900">{formatDateTime(selectedBooking.bookedAt)}</span>
                    </div>
                    {selectedBooking.confirmedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Confirmed</span>
                        <span className="font-medium text-slate-900">{formatDateTime(selectedBooking.confirmedAt)}</span>
                      </div>
                    )}
                    {selectedBooking.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Expires</span>
                        <span className="font-medium text-slate-900">{formatDateTime(selectedBooking.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supplier Info */}
                {(selectedBooking.supplierBookingRef || selectedBooking.validatedPrice != null || selectedBooking.priceChangeAmount != null) && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 mb-3">
                      <Hash size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Supplier</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {selectedBooking.supplierBookingRef && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ref</span>
                          <span className="font-medium text-slate-900 font-mono">{selectedBooking.supplierBookingRef}</span>
                        </div>
                      )}
                      {selectedBooking.validatedPrice != null && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Validated</span>
                          <span className="font-medium text-slate-900">{formatCurrency(selectedBooking.validatedPrice)}</span>
                        </div>
                      )}
                      {selectedBooking.priceChangeAmount != null && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Change</span>
                          <span className={`font-medium ${selectedBooking.priceChangeAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                            {formatCurrency(selectedBooking.priceChangeAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Lead Guest PAN */}
              {selectedBooking.leadGuestPan && (
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                  <Mail size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lead Guest PAN</span>
                  <span className="font-mono text-sm text-slate-900">{selectedBooking.leadGuestPan}</span>
                </div>
              )}

              {/* Travel Dates */}
              {selectedBooking.travelDates && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Travel Dates</span>
                  </div>
                  <p className="text-sm text-slate-900">{selectedBooking.travelDates}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end rounded-b-2xl">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
