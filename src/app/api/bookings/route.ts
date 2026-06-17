import { NextResponse } from "next/server";
import * as bookings from "@/lib/db/bookings";
import * as users from "@/lib/db/users";
import { isPrisma, prisma, supabaseAdmin } from "@/lib/db";

async function getUserFromRequest(request: Request) {
  const userEmail = request.headers.get("x-user-email");
  if (!userEmail) return null;
  return users.findByEmail(userEmail);
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await bookings.findByUser((user as any).id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, itemName, providerOrAirline, price, originalPrice, discountApplied, promoCost, couponCodeUsed, pnr, seatOrRoom, paxCount, travelDates, paymentMethod, leadGuestPan, status: bookingStatus } = body;

    if (!type || !itemName || price === undefined) {
      return NextResponse.json(
        { error: "Type, itemName, and price are required" },
        { status: 400 }
      );
    }

    const bookingId = crypto.randomUUID();
    const pnrCode = pnr || `GR${Date.now().toString(36).toUpperCase()}`;

    const booking = await bookings.create({
      id: bookingId,
      userId: (user as any).id,
      type,
      itemName,
      providerOrAirline,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      discountApplied: discountApplied ? Number(discountApplied) : 0,
      promoCost: promoCost ? Number(promoCost) : 0,
      couponCodeUsed,
      pnr: pnrCode,
      seatOrRoom,
      paxCount: paxCount || 1,
      travelDates: typeof travelDates === "object" ? JSON.stringify(travelDates) : travelDates,
      leadGuestPan: leadGuestPan || null,
      status: bookingStatus || "CONFIRMED",
    });

    if (paymentMethod) {
      if (isPrisma()) {
        await prisma.payment.create({
          data: {
            bookingId: (booking as any).id,
            amount: Number(price),
            method: paymentMethod,
            status: "PENDING",
          },
        });
      } else {
        await supabaseAdmin.from("Payment").insert({
          bookingId: (booking as any).id,
          amount: Number(price),
          method: paymentMethod,
          status: "PENDING",
        });
      }
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Booking create error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
