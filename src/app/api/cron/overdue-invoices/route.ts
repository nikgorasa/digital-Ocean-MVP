import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find PENDING invoices past dueDate
    const result = await prisma.invoice.updateMany({
      where: {
        status: "PENDING",
        dueDate: { lt: new Date() },
      },
      data: { status: "OVERDUE" },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[Cron] Overdue invoices failed:", e);
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    }, { status: 500 });
  }
}
