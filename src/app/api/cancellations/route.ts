import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";
import { sendEmail, emailTemplates } from "@/lib/email";

const cancellationSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  reason: z.string().min(1, "reason is required"),
});

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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = cancellationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { bookingId, reason } = parsed.data;

    const existing = await prisma.cancellationRequest.findFirst({ where: { bookingId } });
    if (existing) {
      return NextResponse.json({ error: "Cancellation already requested for this booking" }, { status: 409 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ error: "You can only cancel your own bookings" }, { status: 403 });
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
        userId: user.id,
        reason,
        status: "COMPLETED",
        processedBy: "SYSTEM",
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
    });

    // Send cancellation email
    try {
      const template = emailTemplates.bookingCancelled({
        guestName: user.name || "Guest",
        hotelName: booking.itemName,
        reason,
      });
      await sendEmail({ to: user.email, subject: template.subject, html: template.html });
    } catch (e) {
      console.error("[Email] Failed to send cancellation email:", e);
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
