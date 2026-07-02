import { NextResponse } from "next/server";
import * as bookings from "@/lib/db/bookings";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBookingSchema = z.object({
  type: z.string().min(1, "type is required"),
  itemName: z.string().min(1, "itemName is required"),
  providerOrAirline: z.string().optional(),
  price: z.number().min(0, "price must be non-negative"),
  originalPrice: z.number().optional(),
  discountApplied: z.number().optional(),
  promoCost: z.number().optional(),
  couponCodeUsed: z.string().optional(),
  pnr: z.string().optional(),
  seatOrRoom: z.string().optional(),
  paxCount: z.number().int().min(1).optional(),
  travelDates: z.union([z.string(), z.object({}).passthrough()]).optional(),
  paymentMethod: z.string().optional(),
  leadGuestPan: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await bookings.findByUser(user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { type, itemName, providerOrAirline, price, originalPrice, discountApplied, promoCost, couponCodeUsed, pnr, seatOrRoom, paxCount, travelDates, paymentMethod, leadGuestPan } = parsed.data;

    const bookingId = crypto.randomUUID();
    const pnrCode = pnr || `GR${Date.now().toString(36).toUpperCase()}`;

    const booking = await bookings.create({
      id: bookingId,
      userId: user.id,
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
      status: "PENDING",
    });

    if (paymentMethod) {
      await prisma.payment.create({
        data: {
          bookingId: (booking as { id: string }).id,
          amount: Number(price),
          method: paymentMethod,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Booking create error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
