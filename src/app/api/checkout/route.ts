import { NextRequest, NextResponse } from "next/server";
import { createCheckout, PAYMENT_CONFIG } from "@/lib/payment";
import * as users from "@/lib/db/users";
import { isPrisma, prisma, supabaseAdmin } from "@/lib/db";

async function getUserFromRequest(request: Request) {
  const userEmail = request.headers.get("x-user-email");
  if (!userEmail) return null;
  return users.findByEmail(userEmail);
}

async function getBooking(bookingId: string) {
  if (isPrisma()) {
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
  } else {
    const { data } = await supabaseAdmin
      .from('Booking')
      .select('id, price, status, type, "expiresAt", "travelDates", "itemName", "validatedPrice", "priceRevalidatedAt"')
      .eq('id', bookingId)
      .single();
    return data;
  }
}

async function updateBookingPrice(bookingId: string, newPrice: number, priceChange: number) {
  if (isPrisma()) {
    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        validatedPrice: newPrice,
        priceRevalidatedAt: new Date(),
        priceChangeAmount: priceChange,
        price: newPrice,
      },
    });
  } else {
    const { data } = await supabaseAdmin
      .from('Booking')
      .update({
        validatedPrice: newPrice,
        priceRevalidatedAt: new Date().toISOString(),
        priceChangeAmount: priceChange,
        price: newPrice,
      })
      .eq('id', bookingId)
      .select()
      .single();
    return data;
  }
}

async function markBookingExpired(bookingId: string) {
  if (isPrisma()) {
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'EXPIRED', expiredAt: new Date() },
    });
  } else {
    await supabaseAdmin
      .from('Booking')
      .update({ status: 'EXPIRED', expiredAt: new Date().toISOString() })
      .eq('id', bookingId);
  }
}

function revalidatePrice(booking: any): { available: boolean; newPrice: number; reason?: string } {
  // In demo/mock mode, simulate a small price change (±5%) or no change
  if (PAYMENT_CONFIG.mock) {
    const rand = Math.random();
    if (rand > 0.85) {
      // 15% chance of price increase
      const increase = Math.round(booking.price * 0.05);
      return { available: true, newPrice: booking.price + increase };
    } else if (rand > 0.7) {
      // 15% chance of price decrease
      const decrease = Math.round(booking.price * 0.03);
      return { available: true, newPrice: booking.price - decrease };
    }
    // 70% chance of same price
    return { available: true, newPrice: booking.price };
  }

  // In production, call TBO API to re-validate
  // For now, return the stored price (TBO integration would go here)
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

    // Check if booking is already confirmed or cancelled
    if (booking.status !== 'PENDING') {
      return NextResponse.json({
        error: `Booking is ${booking.status.toLowerCase()}. Only pending bookings can be paid.`,
      }, { status: 400 });
    }

    // Check expiry
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

    // Re-validate price
    const revalidation = revalidatePrice(booking);

    if (!revalidation.available) {
      await markBookingExpired(bookingId);
      return NextResponse.json({
        error: revalidation.reason || "This booking is no longer available.",
        unavailable: true,
      }, { status: 400 });
    }

    const priceChange = revalidation.newPrice - booking.price;

    // If price changed and user hasn't accepted, return price change info
    if (Math.abs(priceChange) > 1 && !acceptPriceChange) {
      return NextResponse.json({
        priceChanged: true,
        oldPrice: booking.price,
        newPrice: revalidation.newPrice,
        priceChange: priceChange,
        itemName: booking.itemName,
      });
    }

    // If price changed and user accepted, update the booking price
    if (Math.abs(priceChange) > 1 && acceptPriceChange) {
      await updateBookingPrice(bookingId, revalidation.newPrice, priceChange);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const result = await createCheckout({
      bookingId,
      amount: revalidation.newPrice,
      gateway: selectedGateway,
      userEmail: (user as any).email,
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
