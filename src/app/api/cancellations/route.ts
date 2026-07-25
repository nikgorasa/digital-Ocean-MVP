import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { z } from "zod";
import { sendEmail, emailTemplates } from "@/lib/email";
import { cancelBooking } from "@/lib/tbo-hotel-client";
import { cancelFlight, getCancellationCharges } from "@/lib/tbo-flight-client";
import { createRefund } from "@/lib/payment/zaakpay-client";

const cancellationSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  reason: z.string().min(1, "reason is required"),
});

// GET: Fetch cancellation charges before confirming
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        type: true,
        price: true,
        status: true,
        metadata: true,
        supplierBookingRef: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ error: "You can only view charges for your own bookings" }, { status: 403 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Only confirmed bookings can be cancelled" }, { status: 400 });
    }

    const metadata = (booking.metadata as Record<string, unknown>) || {};

    // Get real cancellation charges from TBO
    if (booking.type === "FLIGHT" && booking.supplierBookingRef) {
      try {
        const charges = await getCancellationCharges({
          bookingId: booking.supplierBookingRef,
        });
        return NextResponse.json({
          bookingId: booking.id,
          bookingPrice: booking.price,
          refundAmount: charges.refundAmount,
          cancellationCharge: charges.cancellationCharge,
          currency: charges.currency,
          remarks: charges.remarks,
          source: "tbo",
        });
      } catch (e) {
        console.error("[Cancellation Charges] Flight charges failed:", e);
        return NextResponse.json({
          bookingId: booking.id,
          bookingPrice: booking.price,
          error: "Unable to fetch cancellation charges from airline",
          source: "error",
        });
      }
    }

    if (booking.type === "HOTEL" && metadata.tboBookingId) {
      // For hotels, use the cancellation policies from search results if available
      const cancelPolicies = metadata.cancelPolicies as string[] | undefined;
      if (cancelPolicies && cancelPolicies.length > 0) {
        return NextResponse.json({
          bookingId: booking.id,
          bookingPrice: booking.price,
          cancelPolicies,
          source: "search",
        });
      }
      // If no policies stored, return basic info
      return NextResponse.json({
        bookingId: booking.id,
        bookingPrice: booking.price,
        source: "basic",
        note: "Cancellation charges will be determined by the hotel",
      });
    }

    return NextResponse.json({
      bookingId: booking.id,
      bookingPrice: booking.price,
      source: "basic",
    });
  } catch (error) {
    console.error("Cancellation charges error:", error);
    return NextResponse.json({ error: "Failed to fetch cancellation charges" }, { status: 500 });
  }
}

// POST: Process cancellation
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

    const metadata = (booking.metadata as Record<string, unknown>) || {};
    let refundAmount = booking.price;
    let cancellationFee = 0;
    let tboCancelled = false;
    let tboChangeRequestId: number | undefined;

    // Call TBO cancel API and get real charges
    if (booking.type === "FLIGHT" && booking.supplierBookingRef) {
      try {
        // Get real cancellation charges
        const charges = await getCancellationCharges({
          bookingId: booking.supplierBookingRef,
        });
        refundAmount = charges.refundAmount;
        cancellationFee = charges.cancellationCharge;

        // Cancel with TBO
        const cancelResult = await cancelFlight({
          bookingId: booking.supplierBookingRef,
          remarks: reason,
        });
        tboCancelled = true;
        tboChangeRequestId = cancelResult.changeRequestId;
        console.log(`[TBO Cancel] Flight ${bookingId} cancelled, changeRequestId: ${tboChangeRequestId}`);
      } catch (e) {
        console.error(`[TBO Cancel] Flight cancel failed for ${bookingId}:`, e);
        // Continue with local cancellation even if TBO fails
      }
    }

    if (booking.type === "HOTEL" && metadata.tboBookingId) {
      try {
        const cancelResult = await cancelBooking({
          bookingId: metadata.tboBookingId as number,
          remarks: reason,
        });
        tboCancelled = true;
        tboChangeRequestId = cancelResult.changeRequestId;
        console.log(`[TBO Cancel] Hotel ${bookingId} cancelled, changeRequestId: ${tboChangeRequestId}`);
      } catch (e) {
        console.error(`[TBO Cancel] Hotel cancel failed for ${bookingId}:`, e);
      }
    }

    // Calculate refund percentage
    const refundPercentage = booking.price > 0
      ? Math.round((refundAmount / booking.price) * 100)
      : 0;

    const cancellation = await prisma.cancellationRequest.create({
      data: {
        bookingId,
        userId: user.id,
        reason,
        status: tboCancelled ? "COMPLETED" : "PENDING",
        processedBy: tboCancelled ? "TBO" : "SYSTEM",
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
        metadata: {
          ...metadata,
          cancellationFee,
          refundAmount,
          tboChangeRequestId,
        },
      },
    });

    // Corporate refund: credit back to company wallet
    if (booking.paymentMethod === "corporate_wallet" && booking.companyId) {
      const company = await prisma.company.findUnique({ where: { id: booking.companyId } });
      if (company) {
        const newBalance = company.walletBalance + refundAmount;
        await prisma.$transaction([
          prisma.company.update({
            where: { id: booking.companyId },
            data: { walletBalance: newBalance },
          }),
          prisma.walletLedger.create({
            data: {
              companyId: booking.companyId,
              type: "REFUND",
              amount: refundAmount,
              balanceAfter: newBalance,
              referenceType: "BOOKING",
              referenceId: bookingId,
              description: `Refund: ${booking.itemName} (${refundPercentage}% of ₹${booking.price})`,
              performedBy: "SYSTEM",
            },
          }),
        ]);
      }
    }

    // Gateway refund (Zaakpay) for non-corporate bookings
    if (booking.paymentMethod !== "corporate_wallet" && booking.paymentMethod === "gateway") {
      const payment = await prisma.payment.findUnique({ where: { bookingId } });
      if (payment && payment.orderId && payment.gateway === "zaakpay") {
        try {
          const refundResult = await createRefund(payment.orderId, refundAmount);
          await prisma.payment.update({
            where: { bookingId },
            data: {
              status: "REFUNDED",
              refundedAt: new Date(),
              refundAmount: refundAmount,
              metadata: {
                ...((payment.metadata as Record<string, unknown>) || {}),
                refundId: refundResult.refundId,
              },
            },
          });
          console.log(`[Zaakpay Refund] Booking ${bookingId} refunded: ${refundResult.refundId}`);
        } catch (e) {
          console.error(`[Zaakpay Refund] Failed for booking ${bookingId}:`, e);
          // Don't fail the cancellation - log and continue
        }
      }
    }

    // Cancel associated invoice
    await prisma.invoice.updateMany({
      where: { bookingId },
      data: { status: "CANCELLED" },
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
      tboCancelled,
      tboChangeRequestId,
    }, { status: 201 });
  } catch (error) {
    console.error("Cancellation error:", error);
    return NextResponse.json({ error: "Failed to process cancellation" }, { status: 500 });
  }
}
