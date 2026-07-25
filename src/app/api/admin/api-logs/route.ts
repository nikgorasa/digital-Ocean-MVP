import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");
    const tboStatus = searchParams.get("tboStatus");
    const environment = searchParams.get("environment");
    const requestId = searchParams.get("requestId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "500");

    const where: Record<string, unknown> = {};
    if (provider) where.provider = provider;
    if (status) where.status_code = parseInt(status);
    if (tboStatus) where.tbo_status_code = parseInt(tboStatus);
    if (environment) where.environment = environment;
    if (requestId) where.request_id = requestId;
    if (from || to) {
      where.created_at = {} as Record<string, Date>;
      const created_at = where.created_at as Record<string, Date>;
      if (from) created_at.gte = new Date(from);
      if (to) created_at.lte = new Date(to);
    }

    const data = await prisma.apiLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs: data || [] });
  } catch (e) {
    console.error("API logs fetch error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete logs older than N days (admin only)
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "90");

    if (days < 7) {
      return NextResponse.json({ error: "Minimum retention is 7 days" }, { status: 400 });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await prisma.apiLog.deleteMany({
      where: {
        created_at: { lt: cutoff },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      olderThan: `${days} days`,
      cutoffDate: cutoff.toISOString(),
    });
  } catch (e) {
    console.error("API logs delete error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
