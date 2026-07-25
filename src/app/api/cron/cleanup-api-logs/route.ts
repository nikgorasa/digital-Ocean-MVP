import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Retention period in days — delete anything older than this
const RETENTION_DAYS = 90;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const result = await prisma.apiLog.deleteMany({
      where: {
        created_at: { lt: cutoff },
      },
    });

    console.log(`[Cron] API log cleanup: deleted ${result.count} logs older than ${RETENTION_DAYS} days (cutoff: ${cutoff.toISOString()})`);

    return NextResponse.json({
      success: true,
      deleted: result.count,
      retentionDays: RETENTION_DAYS,
      cutoffDate: cutoff.toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] API log cleanup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}
