import { NextRequest, NextResponse } from "next/server";
import { handleRazorpayWebhook } from "@/lib/payment";
import { PAYMENT_CONFIG } from "@/lib/payment";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Razorpay-Signature") || "";

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const event = (body as { event?: string }).event;
    if (event !== "payment.captured" && event !== "payment.authorized") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentEntity = (body as { payload?: { payment?: { entity?: Record<string, unknown> } } })
      .payload?.payment?.entity;
    if (!paymentEntity) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const result = await handleRazorpayWebhook({
      orderId: paymentEntity.order_id as string,
      paymentId: paymentEntity.id as string,
      signature,
      rawBody,
    });

    return NextResponse.json({ received: true, bookingId: result.bookingId }, { status: 200 });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
