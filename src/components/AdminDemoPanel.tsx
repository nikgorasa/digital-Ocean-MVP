"use client";

import React, { useState, useEffect } from "react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical, CreditCard, XCircle, CheckCircle, Clock,
  RefreshCw, Trash2, ChevronDown, Loader2, Play, AlertTriangle
} from "lucide-react";

interface Booking {
  id: string;
  type: string;
  itemName: string;
  price: number;
  status: string;
  pnr?: string;
  travelDates?: string;
  bookedAt: string;
  userEmail?: string;
}

export default function AdminDemoPanel() {
  const { demoMode } = useDemoMode();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (Array.isArray(data)) setBookings(data);
    } catch {
      console.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (demoMode && isAdmin) fetchBookings();
  }, [demoMode, isAdmin]);

  const simulatePayment = async (bookingId: string, scenario: "success" | "failure") => {
    setActionLoading(bookingId);
    setMessage(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, mockScenario: scenario }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.success) {
        window.location.href = `/payment/success?bookingId=${bookingId}&mock=true&amount=${data.amount || 0}`;
      } else {
        setMessage({ type: "error", text: data.error || "Checkout failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setActionLoading(null);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    setMessage(null);
    try {
      const res = await fetch("/api/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, userId: user!.id, reason: "Admin demo cancellation" }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Booking cancelled" });
        fetchBookings();
      } else {
        setMessage({ type: "error", text: "Cancellation failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED": return <CheckCircle size={14} className="text-green-500" />;
      case "CANCELLED": return <XCircle size={14} className="text-red-500" />;
      case "PENDING": return <Clock size={14} className="text-yellow-500" />;
      default: return <Clock size={14} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-green-100 text-green-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const filtered = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

  if (!demoMode || !isAdmin) return null;

  return (
    <div className="bg-white rounded-2xl border border-purple-200 overflow-hidden">
      <div className="bg-purple-50 border-b border-purple-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical size={20} className="text-purple-600" />
          <div>
            <h3 className="font-bold text-slate-900">Demo Control Panel</h3>
            <p className="text-xs text-purple-600">Simulate booking scenarios</p>
          </div>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg cursor-pointer"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="p-6">
        {/* Status Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["ALL", "PENDING", "CONFIRMED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                filter === s
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s} {s !== "ALL" && `(${bookings.filter(b => b.status === s).length})`}
            </button>
          ))}
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-4 p-3 rounded-xl text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookings List */}
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 size={24} className="animate-spin text-purple-600 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No bookings found. Complete a booking in demo mode to see it here.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filtered.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(booking.status)}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{booking.type}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{booking.itemName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {booking.pnr && (
                      <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded">
                        {booking.pnr}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-700">{formatCurrency(booking.price)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {booking.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => simulatePayment(booking.id, "success")}
                        disabled={actionLoading === booking.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold hover:bg-green-700 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === booking.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Play size={10} />
                        )}
                        Pay
                      </button>
                      <button
                        onClick={() => simulatePayment(booking.id, "failure")}
                        disabled={actionLoading === booking.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700 cursor-pointer disabled:opacity-50"
                      >
                        <AlertTriangle size={10} />
                        Fail
                      </button>
                    </>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-bold hover:bg-orange-700 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === booking.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Trash2 size={10} />
                      )}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Scenarios */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Scenarios</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/flights"
              className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Play size={12} />
              Book a Flight
            </a>
            <a
              href="/hotels"
              className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Play size={12} />
              Book a Hotel
            </a>
            <a
              href="/trips"
              className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl text-xs font-bold text-orange-700 hover:bg-orange-100 transition-colors"
            >
              <Play size={12} />
              View My Trips
            </a>
            <a
              href="/holidays"
              className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <Play size={12} />
              Holiday Planner
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
