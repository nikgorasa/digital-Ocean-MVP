"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h1>
        <p className="text-sm text-slate-500 mb-6">
          Your payment could not be processed. Your booking has not been confirmed.
          No amount has been charged.
        </p>
        {bookingId && (
          <p className="text-xs text-slate-400 mb-6">
            Booking Reference: <span className="font-mono font-bold text-slate-600">{bookingId}</span>
          </p>
        )}
        <div className="flex flex-col gap-3">
          {bookingId && (
            <button
              onClick={() => window.location.href = `/trips`}
              className="w-full py-3 bg-brand-saffron text-white rounded-xl font-bold hover:bg-brand-burnt transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={16} />
              Retry Payment
            </button>
          )}
          <button
            onClick={() => window.location.href = `/`}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto mb-4" />
        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-2" />
        <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto" />
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentFailedContent />
    </Suspense>
  );
}
