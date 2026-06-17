import { NextRequest, NextResponse } from "next/server";
import { handleRazorpayWebhook } from "../../../payment-service";
import { PAYMENT_CONFIG } from "../../../config";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Razorpay-Signature") || "";

    if (!PAYMENT_CONFIG.mock && !signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const event = body.event;
    if (event !== "payment.captured" && event !== "payment.authorized") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentEntity = body.payload?.payment?.entity;
    if (!paymentEntity) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const result = await handleRazorpayWebhook({
      orderId: paymentEntity.order_id,
      paymentId: paymentEntity.id,
      signature,
      rawBody,
    });

    return NextResponse.json({ received: true, bookingId: result.bookingId }, { status: 200 });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
