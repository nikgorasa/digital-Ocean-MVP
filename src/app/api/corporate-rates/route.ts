import { NextResponse } from "next/server";
import { isPrisma, prisma, supabaseAdmin } from "@/lib/db";

export async function GET() {
  try {
    let rates;
    if (isPrisma()) {
      rates = await prisma.corporateRate.findMany({
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      const { data } = await supabaseAdmin
        .from('CorporateRate')
        .select('*, company:Company(name)')
        .order('createdAt', { ascending: false })
      rates = data || [];
    }
    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch corporate rates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, category, destination, discountType, discountValue, maxDiscount, isActive } = body;

    if (!companyId || !discountType || discountValue == null) {
      return NextResponse.json(
        { error: "companyId, discountType, and discountValue are required" },
        { status: 400 }
      );
    }

    let rate;
    if (isPrisma()) {
      rate = await prisma.corporateRate.create({
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
    } else {
      const { data } = await supabaseAdmin
        .from('CorporateRate')
        .insert({
          companyId,
          category: category || "ALL",
          destination: destination || null,
          discountType,
          discountValue,
          maxDiscount: maxDiscount || null,
          isActive: isActive !== false,
        })
        .select()
        .single();
      rate = data;
    }

    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
