import { NextRequest, NextResponse } from "next/server";
import { handlePhonePeWebhook } from "@/lib/payment";
import { verifyCallback } from "@/lib/payment/phonepe-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const header = request.headers.get("X-VERIFY") || "";

    if (!verifyCallback(JSON.stringify(body), header)) {
      return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
    }

    let decodedPayload: any;
    try {
      const decoded = Buffer.from(body.response, "base64").toString("utf-8");
      decodedPayload = JSON.parse(decoded);
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const transactionId = decodedPayload.merchantTransactionId;
    const state = decodedPayload.state;

    const result = await handlePhonePeWebhook({
      transactionId,
      state,
      payload: decodedPayload,
    });

    return NextResponse.json({ received: true, bookingId: result.bookingId }, { status: 200 });
  } catch (error) {
    console.error("PhonePe webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
