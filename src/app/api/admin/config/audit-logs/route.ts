import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {};
    if (provider) where.provider = provider;

    const logs = await prisma.configAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ logs: logs || [] });
  } catch (e) {
    console.error("Config audit logs fetch error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
