import { PAYMENT_CONFIG } from "./config";
import { generateMockOrderId, getMockCheckoutUrl } from "./mock-handler";
import type {
  ZaakpayOrderResponse,
  ZaakpayCheckStatusResponse,
} from "./types";

function computeChecksum(params: Record<string, string | number>): string {
  const crypto = require("crypto");
  const sortedKeys = Object.keys(params).sort();
  const data = sortedKeys.map((k) => params[k]).join("|");
  return crypto.createHmac("sha256", PAYMENT_CONFIG.zaakpay.salt).update(data).digest("hex");
}

export async function createOrder(params: {
  amount: number;
  transactionId: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ merchantTxnId: string; checkoutUrl: string }> {
  if (PAYMENT_CONFIG.mock) {
    const orderId = generateMockOrderId();
    const bookingId = new URL(params.returnUrl).searchParams.get("bookingId") || "";
    const checkoutUrl = getMockCheckoutUrl(orderId, PAYMENT_CONFIG.appUrl, bookingId, params.amount);
    return { merchantTxnId: orderId, checkoutUrl };
  }

  const merchantId = PAYMENT_CONFIG.zaakpay.merchantId;
  const amountPaisa = Math.round(params.amount * 100);
  const txnId = params.transactionId;
  const ts = Math.floor(Date.now() / 1000);

  const checksum = computeChecksum({
    merchantId,
    amount: amountPaisa,
    txnId,
    ts,
  });

  const payload = {
    merchantId,
    amount: amountPaisa,
    txnId,
    ts,
    checksum,
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone || "",
  };

  const res = await fetch(`${PAYMENT_CONFIG.zaakpay.apiBase}/merchant/checkoutServer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zaakpay order creation failed: ${err}`);
  }

  const data: ZaakpayOrderResponse = await res.json();
  if (data.status !== 0) {
    throw new Error(`Zaakpay error: ${data.msg}`);
  }

  return {
    merchantTxnId: data.merchantTransactionId,
    checkoutUrl: `${PAYMENT_CONFIG.zaakpay.apiBase}/merchant/pay/${merchantId}/${txnId}`,
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  headerChecksum: string
): boolean {
  if (PAYMENT_CONFIG.mock) return true;

  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", PAYMENT_CONFIG.zaakpay.salt)
    .update(rawBody)
    .digest("hex");

  return expected === headerChecksum;
}

export async function fetchPaymentStatus(merchantTxnId: string): Promise<{
  state: string;
  amount: number;
  transactionId: string;
}> {
  if (PAYMENT_CONFIG.mock) {
    return { state: "COMPLETED", amount: 0, transactionId: merchantTxnId };
  }

  const endpoint = `/merchant/checkStatus?merchantId=${PAYMENT_CONFIG.zaakpay.merchantId}&txnId=${merchantTxnId}`;

  const sha256 = require("crypto")
    .createHash("sha256")
    .update(merchantTxnId + PAYMENT_CONFIG.zaakpay.salt)
    .digest("hex");

  const res = await fetch(`${PAYMENT_CONFIG.zaakpay.apiBase}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Auth": PAYMENT_CONFIG.zaakpay.merchantId,
      "X-Auth-Sign": `${sha256}###1`,
    },
  });

  if (!res.ok) throw new Error("Zaakpay status check failed");

  const data: ZaakpayCheckStatusResponse = await res.json();
  return {
    state: data.data.state || "FAILED",
    amount: (data.data.amount || 0) / 100,
    transactionId: data.data.transactionId,
  };
}

export async function createRefund(merchantTxnId: string, amount?: number): Promise<{
  refundId: string;
  amount: number;
}> {
  if (PAYMENT_CONFIG.mock) {
    return { refundId: `mock_refund_${Date.now()}`, amount: amount || 0 };
  }

  const refundTxnId = `REF_${Date.now()}`;
  const amountPaisa = amount ? Math.round(amount * 100) : undefined;

  const payload: Record<string, any> = {
    merchantId: PAYMENT_CONFIG.zaakpay.merchantId,
    txnId: merchantTxnId,
    refundTxnId,
    amount: amountPaisa,
  };

  const res = await fetch(`${PAYMENT_CONFIG.zaakpay.apiBase}/merchant/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth": PAYMENT_CONFIG.zaakpay.merchantId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Zaakpay refund failed");

  const data = await res.json();
  return { refundId: data.refundTxnId || refundTxnId, amount: amount || 0 };
}
