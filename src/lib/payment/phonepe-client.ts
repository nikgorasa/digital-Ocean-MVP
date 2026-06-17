import { PAYMENT_CONFIG } from "./config";
import { generateMockOrderId, generateMockPaymentId, getMockCheckoutUrl } from "./mock-handler";
import type { PhonePePaymentResponse } from "./types";

export async function createPayment(params: {
  amount: number;
  transactionId: string;
  redirectUrl: string;
  callbackUrl: string;
}): Promise<{ paymentLink: string; transactionId: string }> {
  if (PAYMENT_CONFIG.mock) {
    const orderId = generateMockOrderId();
    const checkoutUrl = getMockCheckoutUrl(orderId, PAYMENT_CONFIG.appUrl);
    return { paymentLink: checkoutUrl, transactionId: params.transactionId };
  }

  const payload = {
    merchantId: PAYMENT_CONFIG.phonepe.merchantId,
    merchantTransactionId: params.transactionId,
    amount: params.amount * 100,
    redirectUrl: params.redirectUrl,
    callbackUrl: params.callbackUrl,
    paymentInstrument: { type: "PAY_PAGE" },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");

  const crypto = require("crypto");
  const stringToSign = base64Payload + "/v1/pg/pay" + PAYMENT_CONFIG.phonepe.saltKey;
  const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
  const signature = sha256 + "###" + PAYMENT_CONFIG.phonepe.saltIndex;

  const res = await fetch(`${PAYMENT_CONFIG.phonepe.apiBase}/v1/pg/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": signature,
    },
    body: JSON.stringify({ request: base64Payload }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PhonePe payment creation failed: ${err}`);
  }

  const data: PhonePePaymentResponse = await res.json();
  if (!data.success) {
    throw new Error(`PhonePe error: ${data.code}`);
  }

  return { paymentLink: data.data.paymentLink, transactionId: data.data.transactionId };
}

export function verifyCallback(body: string, header: string): boolean {
  if (PAYMENT_CONFIG.mock) return true;

  const crypto = require("crypto");
  const saltKey = PAYMENT_CONFIG.phonepe.saltKey;
  const saltIndex = PAYMENT_CONFIG.phonepe.saltIndex;

  const sha256 = crypto.createHash("sha256").update(body + saltKey).digest("hex");
  const expectedHeader = sha256 + "###" + saltIndex;
  return expectedHeader === header;
}

export async function checkStatus(transactionId: string) {
  if (PAYMENT_CONFIG.mock) {
    return { state: "COMPLETED", amount: 0 };
  }

  const endpoint = `/v1/pg/order/status/${transactionId}`;
  const sha256 = require("crypto")
    .createHash("sha256")
    .update(endpoint + PAYMENT_CONFIG.phonepe.saltKey)
    .digest("hex");
  const signature = sha256 + "###" + PAYMENT_CONFIG.phonepe.saltIndex;

  const res = await fetch(`${PAYMENT_CONFIG.phonepe.apiBase}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": signature,
      "X-MERCHANT-ID": PAYMENT_CONFIG.phonepe.merchantId,
    },
  });

  if (!res.ok) throw new Error("PhonePe status check failed");
  const data = await res.json();
  return { state: data.data?.state || "FAILED", amount: (data.data?.amount || 0) / 100 };
}
