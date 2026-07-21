import { prisma } from "@/lib/prisma";
import { PAYMENT_CONFIG } from "./config";
import * as zaakpay from "./zaakpay-client";
import type { CheckoutResponse, WebhookResult, PaymentStatus, RefundResult } from "./types";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function createCheckout(params: {
  bookingId: string;
  amount: number;
  gateway: "zaakpay";
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

  const appUrl = params.appUrl || PAYMENT_CONFIG.appUrl;
  const returnUrl = `${appUrl}/payment/success?bookingId=${params.bookingId}`;
  const cancelUrl = `${appUrl}/payment/failed?bookingId=${params.bookingId}`;

  const result = await zaakpay.createOrder({
    amount: params.amount,
    transactionId: payment.id,
    customerEmail: params.userEmail,
    returnUrl,
    cancelUrl,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { orderId: result.merchantTxnId },
  });

  return { checkoutUrl: result.checkoutUrl, orderId: result.merchantTxnId };
}

export async function handleZaakpayWebhook(params: {
  merchantTransactionId: string;
  transactionId: string;
  status: number;
  responseCode: string;
  responseMessage: string;
  rawBody: string;
}): Promise<WebhookResult> {
  const payment = await prisma.payment.findFirst({
    where: { orderId: params.merchantTransactionId },
  });

  if (!payment) {
    throw new Error("Payment not found for transaction: " + params.merchantTransactionId);
  }

  const isCompleted = params.status === 0;
  const isFailed = params.status === -1 || params.status === 2 || params.status === 3;

  if (isCompleted) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        paymentId: params.transactionId,
      },
    });

    const booking = await prisma.booking.findUnique({
      where: { id: payment.bookingId },
    });

    const totalDiscount = (booking?.promoCost || 0) + (booking?.corporateDiscount || 0);

    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: "COMPLETED",
        status: "CONFIRMED",
        confirmedAt: new Date(),
        metadata: {
          ...((booking?.metadata as Record<string, unknown>) || {}),
          totalDiscount,
        },
      },
    });

    try {
      const bookingWithUser = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        include: { user: { select: { email: true, name: true } } },
      });
      if (bookingWithUser?.user?.email) {
        const template = emailTemplates.bookingConfirmation({
          guestName: bookingWithUser.user.name || "Guest",
          hotelName: bookingWithUser.itemName,
          checkIn: typeof bookingWithUser.travelDates === "string" ? bookingWithUser.travelDates : "TBD",
          checkOut: "",
          confirmationNo: bookingWithUser.pnr || payment.bookingId,
          amount: bookingWithUser.price,
        });
        await sendEmail({ to: bookingWithUser.user.email, subject: template.subject, html: template.html });
      }
    } catch (e) {
      console.error("[Email] Failed to send booking confirmation:", e);
    }

    return { success: true, bookingId: payment.bookingId, paymentId: params.transactionId };
  }

  const failureReason = isFailed
    ? `Zaakpay status: ${params.status} — ${params.responseMessage}`
    : `Zaakpay unknown status: ${params.status}`;

  if (isFailed) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureReason,
      },
    });

    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { paymentStatus: "FAILED" },
    });
  }

  return { success: false, bookingId: payment.bookingId };
}

export async function getPaymentStatus(bookingId: string): Promise<PaymentStatus> {
  const payment = await prisma.payment.findFirst({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    return { status: "PENDING", amount: 0, gateway: "zaakpay", createdAt: "" };
  }

  return {
    status: payment.status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED",
    amount: payment.amount,
    gateway: payment.gateway,
    paymentId: payment.paymentId ?? undefined,
    merchantTxnId: payment.orderId ?? undefined,
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
  if (!payment.orderId) {
    throw new Error("No merchant transaction ID for refund");
  }

  const refund = await zaakpay.createRefund(payment.orderId, amount);

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

  return { success: true, refundId: refund.refundId, amount: amount || payment.amount };
}
