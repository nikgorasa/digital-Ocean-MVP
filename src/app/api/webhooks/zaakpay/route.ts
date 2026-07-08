import { NextRequest, NextResponse } from "next/server";
import { handleZaakpayWebhook } from "@/lib/payment";
import { verifyWebhookSignature } from "@/lib/payment/zaakpay-client";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Zaakpay-Signature") || "";

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const merchantTxnId = (body as { merchantTransactionId?: string }).merchantTransactionId;
    const txnId = (body as { transactionId?: string }).transactionId;
    const status = (body as { status?: number }).status;
    const responseCode = (body as { responseCode?: string }).responseCode;
    const responseMessage = (body as { responseMessage?: string }).responseMessage;

    if (!merchantTxnId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const result = await handleZaakpayWebhook({
      merchantTransactionId: merchantTxnId,
      transactionId: txnId || "",
      status: status ?? -2,
      responseCode: responseCode || "",
      responseMessage: responseMessage || "",
      rawBody,
    });

    return NextResponse.json(
      { received: true, bookingId: result.bookingId, success: result.success },
      { status: 200 }
    );
  } catch (error) {
    console.error("Zaakpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// Zaakpay Check Status API — fallback for missed webhooks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchantTxnId = searchParams.get("merchantTransactionId");

    if (!merchantTxnId) {
      return NextResponse.json({ error: "merchantTransactionId required" }, { status: 400 });
    }

    const { fetchPaymentStatus } = await import("@/lib/payment/zaakpay-client");
    const status = await fetchPaymentStatus(merchantTxnId);

    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error("Zaakpay status check error:", error);
    return NextResponse.json(
      { error: "Status check failed", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
