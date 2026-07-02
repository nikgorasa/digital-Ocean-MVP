import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
