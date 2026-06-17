import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rates = await prisma.corporateRate.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: { select: { name: true } } },
    });
    return NextResponse.json(rates);
  } catch {
    return NextResponse.json({ error: "Failed to fetch corporate rates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, category, destination, discountType, discountValue, maxDiscount, isActive } = body;

    if (!companyId || !discountType || discountValue == null) {
      return NextResponse.json(
        { error: "companyId, discountType, and discountValue are required" },
        { status: 400 }
      );
    }

    const rate = await prisma.corporateRate.create({
      data: {
        companyId,
        category: category || "ALL",
        destination: destination || null,
        discountType,
        discountValue,
        maxDiscount: maxDiscount || null,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
