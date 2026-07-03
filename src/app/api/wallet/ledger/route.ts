import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const skip = (page - 1) * limit;

    if (!companyId) {
      return NextResponse.json({ error: "companyId is required" }, { status: 400 });
    }

    const [entries, total] = await Promise.all([
      prisma.walletLedger.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.walletLedger.count({ where: { companyId } }),
    ]);

    return NextResponse.json({ entries, total, page, limit });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Wallet ledger error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet ledger" }, { status: 500 });
  }
}
