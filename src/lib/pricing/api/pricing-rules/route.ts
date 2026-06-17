import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rules = await prisma.pricingRule.findMany({
      orderBy: { priority: "desc" },
    });
    return NextResponse.json(rules);
  } catch {
    return NextResponse.json({ error: "Failed to fetch pricing rules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, type, category, destination, hotelName, airlineCode, roomType,
      markupType, markupValue, minPrice, maxPrice, priority, isActive,
      validFrom, validTo,
    } = body;

    if (!name || !type || markupValue == null) {
      return NextResponse.json(
        { error: "name, type, and markupValue are required" },
        { status: 400 }
      );
    }

    const rule = await prisma.pricingRule.create({
      data: {
        markupPercent: 0,
        name,
        type,
        category: category || "ALL",
        destination: destination || null,
        hotelName: hotelName || null,
        airlineCode: airlineCode || null,
        roomType: roomType || null,
        markupType: markupType || "PERCENT",
        markupValue,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        priority: priority || 0,
        isActive: isActive !== false,
        validFrom: validFrom || null,
        validTo: validTo || null,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
