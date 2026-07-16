"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency, formatDate, formatTravelDates } from "@/lib";
import { X, Printer, Tag, Building2, Loader2 } from "lucide-react";

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

interface DbInvoice {
  id: string;
  number: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  paidAmount: number | null;
  paymentRef: string | null;
  notes: string | null;
  url: string | null;
  issuedAt: string;
  company: { id: string; name: string } | null;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  userName: string;
  userEmail: string;
}

export default function InvoiceModal({ isOpen, onClose, booking, userName, userEmail }: InvoiceModalProps) {
  const [dbInvoice, setDbInvoice] = useState<DbInvoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceChecked, setInvoiceChecked] = useState(false);

  useEffect(() => {
    if (!isOpen || !booking.id) return;
    setLoadingInvoice(true);
    setInvoiceChecked(false);
    fetch(`/api/invoices/user/${booking.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.invoice) setDbInvoice(data.invoice);
        else setDbInvoice(null);
      })
      .catch(() => setDbInvoice(null))
      .finally(() => { setLoadingInvoice(false); setInvoiceChecked(true); });
  }, [isOpen, booking.id]);

  if (!isOpen) return null;

  const inv = dbInvoice;
  const basePrice = inv ? inv.amount : (booking.originalPrice || booking.price);
  const adminDiscount = booking.discountApplied || 0;
  const promoCost = booking.promoCost || 0;
  const total = inv ? inv.totalAmount : booking.price;
  const tax = inv ? inv.taxAmount : 0;
  const invoiceNumber = inv ? inv.number : `INV-${booking.pnr || "GR123456"}`;
  const invoiceDate = inv ? inv.issuedAt : booking.bookedAt;
  const invoiceStatus = inv ? inv.status : (booking.status === "CONFIRMED" ? "PAID" : booking.status);

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
            {loadingInvoice ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                {inv?.company && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-xl">
                    <Building2 size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{inv.company.name}</span>
                  </div>
                )}

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
                    <p className="font-mono font-bold text-slate-900">{invoiceNumber}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(invoiceDate)}</p>
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
                    <p className="font-bold text-slate-900">{formatCurrency(total)}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Base Price</span>
                    <span className="text-slate-900">{formatCurrency(basePrice)}</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax</span>
                      <span className="text-slate-900">{formatCurrency(tax)}</span>
                    </div>
                  )}
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

                {inv?.paymentRef && (
                  <div className="bg-slate-50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-slate-500">
                      Payment Ref: <span className="font-mono font-medium text-slate-700">{inv.paymentRef}</span>
                    </p>
                  </div>
                )}

                <div className={`rounded-xl p-3 mb-4 ${invoiceStatus === "PAID" || invoiceStatus === "CONFIRMED" ? "bg-green-50" : "bg-amber-50"}`}>
                  <p className={`text-sm font-medium ${invoiceStatus === "PAID" || invoiceStatus === "CONFIRMED" ? "text-green-700" : "text-amber-700"}`}>
                    ✓ Payment Status: {invoiceStatus === "PAID" || invoiceStatus === "CONFIRMED" ? "Paid" : invoiceStatus}
                  </p>
                  {inv?.dueDate && invoiceStatus === "PENDING" && (
                    <p className="text-xs text-amber-600 mt-1">
                      Due: {formatDate(inv.dueDate)}
                      {(() => {
                        const days = Math.ceil((new Date(inv.dueDate).getTime() - Date.now()) / 86400000);
                        return days >= 0 ? ` (${days} days remaining)` : ` (${Math.abs(days)} days overdue)`;
                      })()}
                    </p>
                  )}
                </div>

                {inv?.notes && (
                  <div className="bg-slate-50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-slate-500">{inv.notes}</p>
                  </div>
                )}

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
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
