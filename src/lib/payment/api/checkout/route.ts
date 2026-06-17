import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCheckout } from "../../payment-service";
import { PAYMENT_CONFIG } from "../../config";

export async function POST(request: NextRequest) {
  try {
    const userEmail = request.headers.get("x-user-email");
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, gateway } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const selectedGateway = gateway || PAYMENT_CONFIG.gateway;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { price: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const result = await createCheckout({
      bookingId,
      amount: booking.price,
      gateway: selectedGateway,
      userEmail: user.email,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
