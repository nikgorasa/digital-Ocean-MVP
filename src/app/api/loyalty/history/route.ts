import { NextRequest, NextResponse } from "next/server";
import * as bookings from "@/lib/db/bookings";
import * as rewards from "@/lib/db/rewards";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { isPrisma, prisma, supabaseAdmin } = await import("@/lib/db");

    let bookingRows: any[] = [];
    let redemptionRows: any[] = [];

    if (isPrisma()) {
      [bookingRows, redemptionRows] = await Promise.all([
        prisma.booking.findMany({
          where: { userId },
          select: { itemName: true, bookedAt: true, price: true },
          orderBy: { bookedAt: 'desc' },
          take: 50,
        }),
        prisma.redemption.findMany({
          where: { userId },
          select: { pointsCost: true, createdAt: true, rewardId: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);
    } else {
      const [bookingsRes, redemptionsRes] = await Promise.all([
        supabaseAdmin
          .from('Booking')
          .select('itemName, bookedAt, price')
          .eq('userId', userId)
          .order('bookedAt', { ascending: false })
          .limit(50),
        supabaseAdmin
          .from('Redemption')
          .select('pointsCost, createdAt, rewardId')
          .eq('userId', userId)
          .order('createdAt', { ascending: false })
          .limit(50),
      ]);
      bookingRows = bookingsRes.data || [];
      redemptionRows = redemptionsRes.data || [];
    }

    const earned = bookingRows.map((b: any) => ({
      action: `Booking (${b.itemName})`,
      points: `+${Math.round(Number(b.price) / 100)}`,
      date: String(b.bookedAt || ""),
      type: "earned" as const,
    }));

    const redeemed = redemptionRows.map((r: any) => ({
      action: "Redeemed reward",
      points: `-${Number(r.pointsCost).toLocaleString()}`,
      date: String(r.createdAt || ""),
      type: "redeemed" as const,
    }));

    const history = [...earned, ...redeemed].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
