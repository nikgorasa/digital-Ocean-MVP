import { PAYMENT_CONFIG } from "./config";
import { generateMockOrderId, getMockCheckoutUrl } from "./mock-handler";
import type { RazorpayOrder } from "./types";

export async function createOrder(params: {
  amount: number;
  receipt: string;
  appUrl?: string;
}): Promise<{ id: string; amount: number; checkoutUrl: string }> {
  if (PAYMENT_CONFIG.mock) {
    const orderId = generateMockOrderId();
    const checkoutUrl = getMockCheckoutUrl(orderId, params.appUrl || PAYMENT_CONFIG.appUrl, params.receipt, params.amount);
    return { id: orderId, amount: params.amount, checkoutUrl };
  }

  const auth = Buffer.from(
    `${PAYMENT_CONFIG.razorpay.keyId}:${PAYMENT_CONFIG.razorpay.keySecret}`
  ).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount * 100,
      currency: "INR",
      receipt: params.receipt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }

  const order: RazorpayOrder = await res.json();
  const checkoutUrl = `https://checkout.razorpay.com/v1/checkout.js?order_id=${order.id}`;
  return { id: order.id, amount: params.amount, checkoutUrl };
}

export function verifySignature(body: string, signature: string): boolean {
  if (PAYMENT_CONFIG.mock) return true;

  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", PAYMENT_CONFIG.razorpay.webhookSecret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

export async function fetchPayment(paymentId: string) {
  if (PAYMENT_CONFIG.mock) {
    return { id: paymentId, status: "captured", method: "upi" };
  }

  const auth = Buffer.from(
    `${PAYMENT_CONFIG.razorpay.keyId}:${PAYMENT_CONFIG.razorpay.keySecret}`
  ).toString("base64");

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) throw new Error("Failed to fetch Razorpay payment");
  return res.json();
}

export async function createRefund(paymentId: string, amount?: number) {
  if (PAYMENT_CONFIG.mock) {
    return { id: `mock_refund_${Date.now()}`, amount: amount || 0 };
  }

  const auth = Buffer.from(
    `${PAYMENT_CONFIG.razorpay.keyId}:${PAYMENT_CONFIG.razorpay.keySecret}`
  ).toString("base64");

  const body: any = {};
  if (amount) body.amount = amount * 100;

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Razorpay refund failed");
  const data = await res.json();
  return { id: data.id, amount: amount || 0 };
}
