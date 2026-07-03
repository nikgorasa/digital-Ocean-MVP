import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    // Send reminders for bookings expiring in the next 12 hours
    const expiringBookings = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        expiresAt: { gt: now, lt: twelveHoursFromNow },
      },
      include: { user: { select: { email: true, name: true } } },
    });

    for (const booking of expiringBookings) {
      if (booking.user?.email) {
        try {
          const template = emailTemplates.paymentReminder({
            guestName: booking.user.name || "Guest",
            hotelName: booking.itemName,
            amount: booking.price,
            bookingId: booking.id,
          });
          await sendEmail({ to: booking.user.email, subject: template.subject, html: template.html });
        } catch (e) {
          console.error("[Email] Failed to send reminder for booking:", booking.id, e);
        }
      }
    }

    // Expire overdue bookings
    const result = await prisma.booking.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: {
        status: "EXPIRED",
        expiredAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      expiredCount: result.count,
      remindersSent: expiringBookings.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Expiry cron error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}
