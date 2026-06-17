"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface PaymentStatusPageProps {
  bookingId: string;
  orderId?: string;
}

type Status = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export default function PaymentStatusPage({ bookingId, orderId }: PaymentStatusPageProps) {
  const [status, setStatus] = useState<Status>("PROCESSING");
  const [amount, setAmount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 30;

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment-status/${bookingId}`);
      const data = await res.json();
      setAmount(data.amount);

      if (data.status === "COMPLETED") {
        setStatus("COMPLETED");
        return;
      }
      if (data.status === "FAILED") {
        setStatus("FAILED");
        return;
      }

      setAttempts((prev) => {
        if (prev >= maxAttempts) {
          setStatus("FAILED");
          return prev;
        }
        return prev + 1;
      });
    } catch {
      setAttempts((prev) => prev + 1);
    }
  }, [bookingId]);

  useEffect(() => {
    if (status === "COMPLETED" || status === "FAILED") return;
    if (attempts >= maxAttempts) {
      setStatus("FAILED");
      return;
    }

    const timer = setTimeout(checkStatus, 2000);
    return () => clearTimeout(timer);
  }, [attempts, status, checkStatus]);

  if (status === "COMPLETED") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Confirmed!</h2>
        <p className="text-slate-500 mb-4">Your booking has been confirmed.</p>
        <a
          href="/trips"
          className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
        >
          View My Trips
        </a>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Failed</h2>
        <p className="text-slate-500 mb-4">The payment could not be completed.</p>
        <div className="flex gap-3 justify-center">
          <a
            href="/trips"
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300"
          >
            Go to My Trips
          </a>
          <button
            onClick={() => { setStatus("PROCESSING"); setAttempts(0); }}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <Loader2 size={40} className="mx-auto text-emerald-600 mb-4 animate-spin" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Processing Payment...</h2>
      <p className="text-slate-500">Please wait while we confirm your payment.</p>
      <p className="text-xs text-slate-400 mt-2">This usually takes a few seconds.</p>
    </div>
  );
}
