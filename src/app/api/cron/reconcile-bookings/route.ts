import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBookingDetail as getFlightBookingDetail } from "@/lib/tbo-flight-client";
import { getBookingDetail as getHotelBookingDetail } from "@/lib/tbo-hotel-client";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find stuck PENDING bookings with supplierBookingRef older than 30 minutes
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000);

    const stuckBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        supplierBookingRef: { not: null },
        bookedAt: { lt: cutoffTime },
      },
      select: {
        id: true,
        type: true,
        supplierBookingRef: true,
        price: true,
        userId: true,
        companyId: true,
        paymentMethod: true,
        metadata: true,
        itemName: true,
      },
    });

    console.log(`[Reconcile Cron] Found ${stuckBookings.length} stuck PENDING bookings`);

    const results = [];

    for (const booking of stuckBookings) {
      try {
        let tboStatus: "CONFIRMED" | "CANCELLED" | "PENDING" | "UNKNOWN" = "UNKNOWN";
        let tboRefundAmount = 0;
        let tboCancellationCharge = 0;

        if (booking.type === "FLIGHT" && booking.supplierBookingRef) {
          const details = await getFlightBookingDetail({ bookingIds: [booking.supplierBookingRef] });
          if (details.length > 0) {
            const flightDetail = details[0];
            // TBO flight status: check itinerary status
            // FlightItinerary typically has BookingStatus or similar
            if (flightDetail.BookingStatus === "Confirmed" || flightDetail.BookingStatus === "Booked") {
              tboStatus = "CONFIRMED";
            } else if (flightDetail.BookingStatus === "Cancelled") {
              tboStatus = "CANCELLED";
            }
          }
        } else if (booking.type === "HOTEL" && booking.supplierBookingRef) {
          const detail = await getHotelBookingDetail({ bookingId: Number(booking.supplierBookingRef) });
          if (detail.status) {
            const status = detail.status.toLowerCase();
            if (status.includes("confirm") || status.includes("booked")) {
              tboStatus = "CONFIRMED";
            } else if (status.includes("cancel")) {
              tboStatus = "CANCELLED";
            }
          }
        }

        let actionTaken = "none";

        if (tboStatus === "CONFIRMED") {
          // TBO says confirmed but local is PENDING - complete the booking
          const metadata = (booking.metadata as Record<string, unknown>) || {};

          await prisma.$transaction([
            prisma.booking.update({
              where: { id: booking.id },
              data: {
                status: "CONFIRMED",
                paymentStatus: "COMPLETED",
                confirmedAt: new Date(),
                paymentMethod: booking.paymentMethod || "gateway",
                metadata: {
                  ...metadata,
                  reconciledAt: new Date().toISOString(),
                  reconciledStatus: tboStatus,
                },
              },
            }),
            // Create payment record if missing
            ...(booking.paymentMethod !== "corporate_wallet" ? [
              prisma.payment.create({
                data: {
                  bookingId: booking.id,
                  amount: booking.price,
                  method: booking.paymentMethod || "gateway",
                  gateway: "zaakpay",
                  status: "COMPLETED",
                },
              }),
            ] : []),
          ]);

          actionTaken = "auto_confirmed";
          console.log(`[Reconcile Cron] Booking ${booking.id} auto-confirmed (TBO confirmed)`);
        } else if (tboStatus === "CANCELLED") {
          // TBO says cancelled but local is PENDING - mark cancelled
          const metadata = (booking.metadata as Record<string, unknown>) || {};

          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: "CANCELLED",
              paymentStatus: "REFUNDED",
              metadata: {
                ...metadata,
                reconciledAt: new Date().toISOString(),
                reconciledStatus: tboStatus,
                reconciledNote: "Auto-cancelled via reconciliation cron",
              },
            },
          });

          // Cancel associated invoice
          await prisma.invoice.updateMany({
            where: { bookingId: booking.id },
            data: { status: "CANCELLED" },
          });

          actionTaken = "auto_cancelled";
          console.log(`[Reconcile Cron] Booking ${booking.id} auto-cancelled (TBO cancelled)`);
        } else if (tboStatus === "UNKNOWN") {
          // Still unknown - could be TBO API issue or still processing
          console.log(`[Reconcile Cron] Booking ${booking.id} status unknown from TBO`);
        }

        results.push({
          bookingId: booking.id,
          type: booking.type,
          supplierBookingRef: booking.supplierBookingRef,
          tboStatus,
          actionTaken,
        });
      } catch (e) {
        console.error(`[Reconcile Cron] Error processing booking ${booking.id}:`, e);
        results.push({
          bookingId: booking.id,
          type: booking.type,
          supplierBookingRef: booking.supplierBookingRef,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("[Reconcile Cron] Fatal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}