"use client";

import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib";

interface CheckoutButtonProps {
  bookingId: string;
  amount: number;
  gateway?: "razorpay" | "phonepe";
  userEmail: string;
  onPaymentStart?: () => void;
  onPaymentError?: (error: string) => void;
  className?: string;
}

export default function CheckoutButton({
  bookingId,
  amount,
  gateway = "razorpay",
  userEmail,
  onPaymentStart,
  onPaymentError,
  className = "",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    onPaymentStart?.();

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({ bookingId, gateway }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      onPaymentError?.(message);
      setLoading(false);
    }
  };

  return (
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
  );
}
