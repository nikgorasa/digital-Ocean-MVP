import { NextRequest, NextResponse } from "next/server";
import * as pricing from "@/lib/db/pricing";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, category, destination, hotelName, airlineCode, markupType, markupValue, markupPercent, minPrice, maxPrice, priority, isActive, validFrom, validTo } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (destination !== undefined) updateData.destination = destination;
    if (hotelName !== undefined) updateData.hotelName = hotelName;
    if (airlineCode !== undefined) updateData.airlineCode = airlineCode;
    if (markupType !== undefined) updateData.markupType = markupType;
    if (markupValue !== undefined) updateData.markupValue = markupValue;
    if (markupPercent !== undefined) updateData.markupPercent = markupPercent;
    if (minPrice !== undefined) updateData.minPrice = minPrice;
    if (maxPrice !== undefined) updateData.maxPrice = maxPrice;
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (validFrom !== undefined) updateData.validFrom = validFrom;
    if (validTo !== undefined) updateData.validTo = validTo;

    const rule = await pricing.update(id, updateData);
    return NextResponse.json(rule);
  } catch (error) {
    console.error("Pricing rule update error:", error);
    return NextResponse.json({ error: "Failed to update pricing rule" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await pricing.remove(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
