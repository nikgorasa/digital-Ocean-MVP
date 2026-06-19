import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calculateMockRefund(bookingPrice: number, bookedAt: Date): {
  refundAmount: number;
  cancellationFee: number;
  refundPercentage: number;
} {
  const now = new Date();
  const hoursSinceBooking = (now.getTime() - bookedAt.getTime()) / (1000 * 60 * 60);

  let refundPercentage: number;
  if (hoursSinceBooking <= 24) {
    refundPercentage = 100;
  } else if (hoursSinceBooking <= 48) {
    refundPercentage = 75;
  } else if (hoursSinceBooking <= 168) {
    refundPercentage = 50;
  } else {
    refundPercentage = 25;
  }

  const refundAmount = Math.round(bookingPrice * (refundPercentage / 100));
  const cancellationFee = bookingPrice - refundAmount;

  return { refundAmount, cancellationFee, refundPercentage };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, userId, reason } = body;

    if (!bookingId || !userId || !reason) {
      return NextResponse.json({ error: "bookingId, userId, and reason are required" }, { status: 400 });
    }

    const existing = await prisma.cancellationRequest.findFirst({ where: { bookingId } });
    if (existing) {
      return NextResponse.json({ error: "Cancellation already requested for this booking" }, { status: 409 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Only confirmed bookings can be cancelled" }, { status: 400 });
    }

    const { refundAmount, cancellationFee, refundPercentage } = calculateMockRefund(
      booking.price,
      new Date(booking.bookedAt),
    );

    const cancellation = await prisma.cancellationRequest.create({
      data: {
        bookingId,
        userId,
        reason,
        status: "COMPLETED",
        processedBy: "SYSTEM",
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
    });

    return NextResponse.json({
      ...cancellation,
      refundAmount,
      cancellationFee,
      refundPercentage,
    }, { status: 201 });
  } catch (error) {
    console.error("Cancellation error:", error);
    return NextResponse.json({ error: "Failed to process cancellation" }, { status: 500 });
  }
}
