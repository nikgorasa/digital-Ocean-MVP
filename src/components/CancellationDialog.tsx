"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "@/lib";
import { X, Loader2, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface CancellationCharges {
  bookingId: string;
  bookingPrice: number;
  refundAmount?: number;
  cancellationCharge?: number;
  currency?: string;
  remarks?: string;
  cancelPolicies?: string[];
  source: "tbo" | "search" | "basic" | "error";
  note?: string;
  error?: string;
}

interface CancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingId: string;
  bookingType: "FLIGHT" | "HOTEL";
  bookingPrice: number;
  itemName: string;
}

type DialogStep = "charges" | "reason" | "confirming" | "success" | "error";

export default function CancellationDialog({
  isOpen,
  onClose,
  onConfirm,
  bookingId,
  bookingType,
  bookingPrice,
  itemName,
}: CancellationDialogProps) {
  const [step, setStep] = useState<DialogStep>("charges");
  const [charges, setCharges] = useState<CancellationCharges | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<{
    refundAmount: number;
    cancellationFee: number;
    refundPercentage: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("charges");
    setLoading(true);
    setReason("");
    setErrorMessage("");
    setResult(null);

    // Fetch cancellation charges
    fetch(`/api/cancellations?bookingId=${bookingId}`)
      .then(res => res.json())
      .then(data => {
        setCharges(data);
        setLoading(false);
      })
      .catch(() => {
        setCharges({ bookingId, bookingPrice, source: "error", error: "Failed to fetch charges" });
        setLoading(false);
      });
  }, [isOpen, bookingId, bookingPrice]);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setStep("confirming");
    setErrorMessage("");

    try {
      await onConfirm(reason);
      // The parent component should handle the result
      setStep("success");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Cancellation failed");
      setStep("error");
    }
  };

  if (!isOpen) return null;

  const refundAmount = charges?.refundAmount ?? bookingPrice;
  const cancellationFee = charges?.cancellationCharge ?? 0;
  const refundPercentage = bookingPrice > 0 ? Math.round((refundAmount / bookingPrice) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center sm:justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-900">Cancel Booking</h2>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Booking Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="font-bold text-slate-900 text-sm">{itemName}</p>
            <p className="text-xs text-slate-500 mt-1">
              {bookingType === "FLIGHT" ? "Flight" : "Hotel"} Booking
            </p>
            <p className="text-lg font-black font-mono text-brand-charcoal mt-2">
              {formatCurrency(bookingPrice)}
            </p>
          </div>

          {/* Step: Loading Charges */}
          {step === "charges" && loading && (
            <div className="flex flex-col items-center py-8">
              <Loader2 size={32} className="animate-spin text-brand-antique-gold mb-3" />
              <p className="text-sm text-slate-500">Fetching cancellation charges...</p>
            </div>
          )}

          {/* Step: Show Charges */}
          {step === "charges" && !loading && charges && (
            <>
              {charges.source === "error" ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-red-700">Unable to fetch charges</p>
                      <p className="text-xs text-red-600 mt-1">
                        {charges.error || "Please try again or contact support."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs font-bold text-amber-800">Cancellation Charges</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Booking Amount</span>
                      <span className="font-mono font-bold">{formatCurrency(bookingPrice)}</span>
                    </div>
                    {charges.source === "tbo" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Cancellation Fee</span>
                          <span className="font-mono text-red-600">{formatCurrency(cancellationFee)}</span>
                        </div>
                        <div className="border-t border-amber-300 pt-2 flex justify-between">
                          <span className="font-bold text-slate-900">Refund Amount</span>
                          <span className="font-mono font-black text-lg text-green-700">
                            {formatCurrency(refundAmount)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {refundPercentage}% refund • {charges.remarks || "Per airline policy"}
                        </p>
                      </>
                    )}
                    {charges.source === "search" && charges.cancelPolicies && (
                      <div className="mt-2">
                        <p className="text-xs font-bold text-slate-600 mb-1">Cancellation Policy:</p>
                        {charges.cancelPolicies.map((policy, i) => (
                          <p key={i} className="text-xs text-slate-500">{policy}</p>
                        ))}
                      </div>
                    )}
                    {charges.source === "basic" && (
                      <p className="text-xs text-slate-500">
                        {charges.note || "Cancellation charges will be determined by the provider."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  onClick={() => setStep("reason")}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 cursor-pointer transition-colors"
                >
                  Proceed to Cancel
                </button>
              </div>
            </>
          )}

          {/* Step: Reason */}
          {step === "reason" && (
            <>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                  Reason for Cancellation
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-brand-saffron focus:ring-offset-2 outline-none"
                />
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Refund Amount</span>
                  <span className="font-mono font-bold text-green-700">{formatCurrency(refundAmount)}</span>
                </div>
                {cancellationFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Cancellation Fee</span>
                    <span className="font-mono text-red-600">-{formatCurrency(cancellationFee)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("charges")}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!reason.trim()}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Confirm Cancellation
                </button>
              </div>
            </>
          )}

          {/* Step: Confirming */}
          {step === "confirming" && (
            <div className="flex flex-col items-center py-8">
              <Loader2 size={32} className="animate-spin text-red-500 mb-3" />
              <p className="text-sm text-slate-500">Processing cancellation...</p>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Booking Cancelled</h3>
              <p className="text-sm text-slate-500 mb-4">
                Your booking has been cancelled successfully.
              </p>
              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Refund Amount</span>
                  <span className="font-mono font-bold text-green-700">{formatCurrency(refundAmount)}</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Refund will be credited to your original payment method.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Cancellation Failed</h3>
              <p className="text-sm text-red-600 mb-4">
                {errorMessage || "Something went wrong. Please try again."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => setStep("reason")}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 cursor-pointer transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
