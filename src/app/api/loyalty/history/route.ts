import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const [bookingRows, redemptionRows] = await Promise.all([
      prisma.booking.findMany({
        where: { userId },
        select: { itemName: true, bookedAt: true, price: true, rewardPointsEarned: true },
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

    const earned = bookingRows.map((b) => ({
      action: `Booking (${b.itemName})`,
      points: `+${b.rewardPointsEarned ?? Math.round(Number(b.price) * 0.015)}`,
      date: String(b.bookedAt || ""),
      type: "earned" as const,
    }));

    const redeemed = redemptionRows.map((r) => ({
      action: "Redeemed reward",
      points: `-${Number(r.pointsCost).toLocaleString()}`,
      date: String(r.createdAt || ""),
      type: "redeemed" as const,
    }));

    const history = [...earned, ...redeemed].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(history);
  } catch {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
