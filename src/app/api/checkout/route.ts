import { NextRequest, NextResponse } from "next/server";
import { createCheckout, PAYMENT_CONFIG } from "@/lib/payment";
import * as users from "@/lib/db/users";
import { prisma } from "@/lib/prisma";

async function getUserFromRequest(request: Request) {
  const userEmail = request.headers.get("x-user-email");
  if (!userEmail) return null;
  return users.findByEmail(userEmail);
}

async function getBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      price: true,
      status: true,
      type: true,
      expiresAt: true,
      travelDates: true,
      itemName: true,
      validatedPrice: true,
      priceRevalidatedAt: true,
    },
  });
}

async function updateBookingPrice(bookingId: string, newPrice: number, priceChange: number) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      validatedPrice: newPrice,
      priceRevalidatedAt: new Date(),
      priceChangeAmount: priceChange,
      price: newPrice,
    },
  });
}

async function markBookingExpired(bookingId: string) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'EXPIRED', expiredAt: new Date() },
  });
}

function revalidatePrice(booking: { price: number }): { available: boolean; newPrice: number; reason?: string } {
  if (PAYMENT_CONFIG.mock) {
    const rand = Math.random();
    if (rand > 0.85) {
      const increase = Math.round(booking.price * 0.05);
      return { available: true, newPrice: booking.price + increase };
    } else if (rand > 0.7) {
      const decrease = Math.round(booking.price * 0.03);
      return { available: true, newPrice: booking.price - decrease };
    }
    return { available: true, newPrice: booking.price };
  }
  return { available: true, newPrice: booking.price };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, gateway, acceptPriceChange } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const selectedGateway = gateway || PAYMENT_CONFIG.gateway;
    const booking = await getBooking(bookingId);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json({
        error: `Booking is ${booking.status.toLowerCase()}. Only pending bookings can be paid.`,
      }, { status: 400 });
    }

    if (booking.expiresAt) {
      const expiresAt = new Date(booking.expiresAt);
      if (expiresAt < new Date()) {
        await markBookingExpired(bookingId);
        return NextResponse.json({
          error: "Booking has expired. Please create a new booking.",
          expired: true,
        }, { status: 400 });
      }
    }

    const revalidation = revalidatePrice(booking);

    if (!revalidation.available) {
      await markBookingExpired(bookingId);
      return NextResponse.json({
        error: revalidation.reason || "This booking is no longer available.",
        unavailable: true,
      }, { status: 400 });
    }

    const priceChange = revalidation.newPrice - booking.price;

    if (Math.abs(priceChange) > 1 && !acceptPriceChange) {
      return NextResponse.json({
        priceChanged: true,
        oldPrice: booking.price,
        newPrice: revalidation.newPrice,
        priceChange: priceChange,
        itemName: booking.itemName,
      });
    }

    if (Math.abs(priceChange) > 1 && acceptPriceChange) {
      await updateBookingPrice(bookingId, revalidation.newPrice, priceChange);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const result = await createCheckout({
      bookingId,
      amount: revalidation.newPrice,
      gateway: selectedGateway,
      userEmail: (user as { email: string }).email,
      appUrl,
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
