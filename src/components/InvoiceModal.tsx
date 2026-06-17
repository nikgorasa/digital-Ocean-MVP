"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency, formatDate, formatTravelDates } from "@/lib";
import { X, Printer, Tag } from "lucide-react";

interface Booking {
  id: string;
  type: string;
  itemName: string;
  providerOrAirline?: string;
  price: number;
  originalPrice?: number;
  discountApplied: number;
  promoCost: number;
  couponCodeUsed?: string;
  status: string;
  pnr?: string;
  paxCount: number;
  travelDates?: string;
  bookedAt: string;
  gstNumber?: string;
  gstCompanyName?: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  userName: string;
  userEmail: string;
}

export default function InvoiceModal({ isOpen, onClose, booking, userName, userEmail }: InvoiceModalProps) {
  if (!isOpen) return null;

  const basePrice = booking.originalPrice || booking.price;
  const adminDiscount = booking.discountApplied || 0;
  const promoCost = booking.promoCost || 0;
  const total = booking.price;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-brand-saffron to-brand-burnt px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold">Tax Invoice</p>
              <p className="text-white font-display font-bold text-lg">GoRASA</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Invoice To</p>
                <p className="font-bold text-slate-900">{userName}</p>
                <p className="text-sm text-slate-500">{userEmail}</p>
                {booking.gstNumber && (
                  <p className="text-xs text-slate-500 mt-1">GSTIN: {booking.gstNumber}</p>
                )}
                {booking.gstCompanyName && (
                  <p className="text-xs text-slate-500">{booking.gstCompanyName}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Invoice No</p>
                <p className="font-mono font-bold text-slate-900">INV-{booking.pnr || "GR123456"}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDate(booking.bookedAt)}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900">{booking.itemName}</p>
                  {booking.providerOrAirline && (
                    <p className="text-sm text-slate-500">{booking.providerOrAirline}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {formatTravelDates(booking.travelDates)} • {booking.paxCount} Pax
                  </p>
                </div>
                <p className="font-bold text-slate-900">{formatCurrency(basePrice)}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Base Price</span>
                <span className="text-slate-900">{formatCurrency(basePrice)}</span>
              </div>
              {adminDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-orange-600">
                    <Tag size={12} />
                    Discount (Admin)
                  </span>
                  <span className="text-orange-600">-{formatCurrency(adminDiscount)}</span>
                </div>
              )}
              {promoCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <Tag size={12} />
                    Promo {booking.couponCodeUsed && `(${booking.couponCodeUsed})`}
                  </span>
                  <span className="text-green-600">-{formatCurrency(promoCost)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-xl text-slate-900">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-3 mb-4">
              <p className="text-green-700 text-sm font-medium">
                ✓ Payment Status: {booking.status === "CONFIRMED" ? "Paid" : booking.status}
              </p>
            </div>

            <div className="text-center text-xs text-slate-400 mb-4">
              <p>RASA Travel Services India Private Limited</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={16} />
                Print
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-brand-saffron text-white rounded-xl text-sm font-bold hover:bg-brand-burnt cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
