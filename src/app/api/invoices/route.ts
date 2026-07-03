import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const companyId = searchParams.get("companyId");
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (companyId) where.companyId = companyId;
    if (startDate || endDate) {
      where.issuedAt = {};
      const issuedAt = where.issuedAt as Record<string, Date>;
      if (startDate) issuedAt.gte = new Date(startDate);
      if (endDate) issuedAt.lte = new Date(endDate + "T23:59:59");
    }
    if (type) {
      where.booking = { type };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          booking: { select: { id: true, type: true, itemName: true, pnr: true } },
        },
        orderBy: { issuedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({ invoices, total, page, limit });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Invoices fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}
