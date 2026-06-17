import { NextRequest, NextResponse } from "next/server";
import { isPrisma, prisma, supabaseAdmin } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Simple auth check — only allow from localhost or with cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow from localhost
    const host = request.headers.get("host") || "";
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date().toISOString();
    let expiredCount = 0;

    if (isPrisma()) {
      const result = await prisma.booking.updateMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: now },
        },
        data: {
          status: "EXPIRED",
          expiredAt: new Date(),
        },
      });
      expiredCount = result.count;
    } else {
      const { data, error } = await supabaseAdmin
        .from("Booking")
        .update({ status: "EXPIRED", expiredAt: now })
        .eq("status", "PENDING")
        .lt("expiresAt", now)
        .select("id");

      if (error) throw error;
      expiredCount = data?.length || 0;
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: now,
    });
  } catch (error) {
    console.error("Expiry cron error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}
