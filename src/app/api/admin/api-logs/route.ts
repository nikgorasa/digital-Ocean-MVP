import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");
    const environment = searchParams.get("environment");
    const requestId = searchParams.get("requestId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "500");

    const where: Record<string, unknown> = {};
    if (provider) where.provider = provider;
    if (status) where.status_code = parseInt(status);
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
