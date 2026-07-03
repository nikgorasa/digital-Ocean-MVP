import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const companyId = searchParams.get("companyId");

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate + "T23:59:59");

    const where: Record<string, unknown> = {};
    if (startDate || endDate) where.issuedAt = dateFilter;
    if (companyId) where.companyId = companyId;

    const now = new Date();

    const [
      totalInvoiced,
      totalCollected,
      pendingCount,
      overdueCount,
      pendingAmount,
      overdueAmount,
      byStatus,
      byCompany,
    ] = await Promise.all([
      prisma.invoice.aggregate({ where, _sum: { totalAmount: true }, _count: true }),
      prisma.invoice.aggregate({ where: { ...where, status: "PAID" }, _sum: { paidAmount: true } }),
      prisma.invoice.count({ where: { ...where, status: "PENDING" } }),
      prisma.invoice.count({ where: { ...where, status: "PENDING", dueDate: { lt: now } } }),
      prisma.invoice.aggregate({ where: { ...where, status: "PENDING" }, _sum: { totalAmount: true } }),
      prisma.invoice.aggregate({ where: { ...where, status: "PENDING", dueDate: { lt: now } }, _sum: { totalAmount: true } }),
      prisma.invoice.groupBy({ by: ["status"], where, _count: true, _sum: { totalAmount: true } }),
      prisma.invoice.groupBy({ by: ["companyId"], where, _count: true, _sum: { totalAmount: true }, orderBy: { _sum: { totalAmount: "desc" } } }),
    ]);

    // Enrich byCompany with company names
    const companyIds = byCompany.map((c) => c.companyId).filter(Boolean);
    const companies = companyIds.length > 0
      ? await prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } })
      : [];
    const companyMap = new Map(companies.map((c) => [c.id, c.name]));

    const enrichedByCompany = byCompany.map((c) => ({
      ...c,
      companyName: companyMap.get(c.companyId) || "Unknown",
    }));

    return NextResponse.json({
      totalInvoiced: totalInvoiced._sum.totalAmount || 0,
      totalInvoices: totalInvoiced._count || 0,
      totalCollected: totalCollected._sum.paidAmount || 0,
      pendingCount,
      overdueCount,
      pendingAmount: pendingAmount._sum.totalAmount || 0,
      overdueAmount: overdueAmount._sum.totalAmount || 0,
      byStatus,
      byCompany: enrichedByCompany,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Invoice stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
