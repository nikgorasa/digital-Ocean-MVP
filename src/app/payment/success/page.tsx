"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PaymentStatusPage from "@/components/PaymentStatusPage";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const orderId = searchParams.get("order_id") || "";
  const isMock = searchParams.get("mock") === "true";
  const mockAmount = searchParams.get("amount");

  // In mock mode, auto-confirm by calling webhook
  useEffect(() => {
    if (isMock && orderId && bookingId) {
      const amount = mockAmount ? Number(mockAmount) * 100 : 100;
      fetch("/api/webhooks/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Razorpay-Signature": "mock" },
        body: JSON.stringify({
          event: "payment.captured",
          payload: {
            payment: { entity: { id: `mock_pay_${Date.now()}`, order_id: orderId, amount, status: "captured", method: "upi" } },
            order: { entity: { id: orderId, amount, receipt: bookingId } },
          },
        }),
      }).catch(console.error);
    }
  }, [isMock, orderId, bookingId, mockAmount]);

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Payment processing...</p>
          <p className="text-xs text-slate-400">If you were redirected here from a booking, please check My Trips.</p>
          <a href="/trips" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            Go to My Trips
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <PaymentStatusPage bookingId={bookingId} orderId={orderId} isMock={isMock} />
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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
