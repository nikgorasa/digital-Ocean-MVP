"use client";

import React, { useState } from "react";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib";

interface CheckoutButtonProps {
  bookingId?: string;
  amount: number;
  gateway?: "razorpay" | "phonepe";
  userEmail: string;
  mockScenario?: "success" | "failure" | "timeout" | "random";
  onPaymentStart?: () => void;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
  className?: string;
}

export default function CheckoutButton({
  bookingId,
  amount,
  gateway = "razorpay",
  userEmail,
  mockScenario,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
  className = "",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    onPaymentStart?.();

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({ bookingId, gateway, mockScenario }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.checkoutUrl) {
        // Mock mode: redirect to success page
        window.location.href = data.checkoutUrl;
      } else if (data.success) {
        // Direct success (mock mode without redirect)
        onPaymentSuccess?.();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setError(message);
      onPaymentError?.(message);
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleCheckout();
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard size={18} />
            Pay {formatCurrency(amount)}
          </>
        )}
      </button>
      
      {error && (
        <div className="space-y-2">
          <p className="text-sm text-red-600 text-center">{error}</p>
          <button
            onClick={handleRetry}
            className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
