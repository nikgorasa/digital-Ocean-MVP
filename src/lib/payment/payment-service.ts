import { prisma } from "@/lib/prisma";
import { PAYMENT_CONFIG } from "./config";
import * as razorpay from "./razorpay-client";
import * as phonepe from "./phonepe-client";
import type { CheckoutResponse, WebhookResult, PaymentStatus, RefundResult } from "./types";

export async function createCheckout(params: {
  bookingId: string;
  amount: number;
  gateway: "razorpay" | "phonepe";
  userEmail: string;
  appUrl?: string;
}): Promise<CheckoutResponse> {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { bookingId: params.bookingId },
    orderBy: { createdAt: "desc" },
  });

  if (existingPayment && existingPayment.status === "COMPLETED") {
    throw new Error("Payment already completed");
  }

  if (existingPayment) {
    await prisma.payment.delete({ where: { id: existingPayment.id } });
  }

  const payment = await prisma.payment.create({
    data: {
      bookingId: params.bookingId,
      amount: params.amount,
      method: params.gateway,
      status: "PENDING",
      gateway: params.gateway,
    },
  });

  let checkoutUrl: string;
  let orderId: string;

  const appUrl = params.appUrl || PAYMENT_CONFIG.appUrl;

  if (params.gateway === "phonepe") {
    const redirectUrl = `${appUrl}/payment/success?bookingId=${params.bookingId}`;
    const callbackUrl = `${appUrl}/api/webhooks/phonepe`;
    const result = await phonepe.createPayment({
      amount: params.amount,
      transactionId: payment.id,
      redirectUrl,
      callbackUrl,
    });
    checkoutUrl = result.paymentLink;
    orderId = result.transactionId;
  } else {
    const result = await razorpay.createOrder({
      amount: params.amount,
      receipt: params.bookingId,
      appUrl,
    });
    checkoutUrl = result.checkoutUrl;
    orderId = result.id;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { orderId },
  });

  return { checkoutUrl, orderId };
}

export async function handleRazorpayWebhook(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  rawBody: string;
}): Promise<WebhookResult> {
  if (!PAYMENT_CONFIG.mock) {
    const valid = razorpay.verifySignature(params.rawBody, params.signature);
    if (!valid) {
      throw new Error("Invalid Razorpay signature");
    }
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId: params.orderId },
  });

  if (!payment) {
    throw new Error("Payment not found for order: " + params.orderId);
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "COMPLETED",
      paymentId: params.paymentId,
      signature: params.signature,
    },
  });

  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      paymentStatus: "COMPLETED",
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });

  return { success: true, bookingId: payment.bookingId, paymentId: params.paymentId };
}

export async function handlePhonePeWebhook(params: {
  transactionId: string;
  state: string;
  payload: any;
}): Promise<WebhookResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: params.transactionId },
  });

  if (!payment) {
    throw new Error("Payment not found: " + params.transactionId);
  }

  if (params.state === "COMPLETED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        paymentId: params.transactionId,
        metadata: params.payload,
      },
    });

    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: "COMPLETED",
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    return { success: true, bookingId: payment.bookingId };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      failureReason: `PhonePe state: ${params.state}`,
    },
  });

  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { paymentStatus: "FAILED" },
  });

  return { success: false, bookingId: payment.bookingId };
}

export async function getPaymentStatus(bookingId: string): Promise<PaymentStatus> {
  const payment = await prisma.payment.findFirst({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    return { status: "PENDING", amount: 0, gateway: "razorpay", createdAt: "" };
  }

  return {
    status: payment.status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED",
    amount: payment.amount,
    gateway: payment.gateway,
    paymentId: payment.paymentId ?? undefined,
    createdAt: payment.createdAt?.toISOString() || "",
  };
}

export async function processRefund(
  paymentId: string,
  amount?: number
): Promise<RefundResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "COMPLETED") {
    throw new Error("Can only refund completed payments");
  }

  if (!payment.paymentId) {
    throw new Error("No gateway payment ID for refund");
  }

  const refund = await razorpay.createRefund(payment.paymentId, amount);

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      refundAmount: amount || payment.amount,
    },
  });

  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { paymentStatus: "REFUNDED" },
  });

  return { success: true, refundId: refund.id, amount: amount || payment.amount };
}
