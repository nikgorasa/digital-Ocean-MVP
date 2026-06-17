import { NextRequest, NextResponse } from "next/server";
import { isPrisma, prisma, supabaseAdmin } from "@/lib/db";

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

    let existing;
    if (isPrisma()) {
      existing = await prisma.cancellationRequest.findFirst({ where: { bookingId } });
    } else {
      const { data } = await supabaseAdmin
        .from('CancellationRequest')
        .select('id')
        .eq('bookingId', bookingId)
        .maybeSingle();
      existing = data;
    }

    if (existing) {
      return NextResponse.json({ error: "Cancellation already requested for this booking" }, { status: 409 });
    }

    let booking;
    if (isPrisma()) {
      booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    } else {
      const { data } = await supabaseAdmin
        .from('Booking')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();
      booking = data;
    }

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

    let cancellation;
    if (isPrisma()) {
      cancellation = await prisma.cancellationRequest.create({
        data: {
          bookingId,
          userId,
          reason,
          status: "COMPLETED",
          processedBy: "SYSTEM",
        },
      });
    } else {
      const { data } = await supabaseAdmin
        .from('CancellationRequest')
        .insert({
          bookingId,
          userId,
          reason,
          status: "COMPLETED",
          processedBy: "SYSTEM",
        })
        .select()
        .single();
      cancellation = data;
    }

    if (isPrisma()) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
      });
    } else {
      await supabaseAdmin
        .from('Booking')
        .update({ status: "CANCELLED", paymentStatus: "REFUNDED" })
        .eq("id", bookingId);
    }

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
