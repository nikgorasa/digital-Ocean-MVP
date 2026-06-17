import { NextRequest, NextResponse } from "next/server";
import * as promos from "@/lib/db/promo-codes";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, discountValue, type, description, minBookingValue, isActive, applicableTo, maxDiscount, maxUses, validFrom, validTo, isFirstBooking } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (code !== undefined) updateData.code = code;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (minBookingValue !== undefined) updateData.minBookingValue = minBookingValue;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (applicableTo !== undefined) updateData.applicableTo = applicableTo;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount;
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (validFrom !== undefined) updateData.validFrom = validFrom;
    if (validTo !== undefined) updateData.validTo = validTo;
    if (isFirstBooking !== undefined) updateData.isFirstBooking = isFirstBooking;

    const promo = await promos.update(id, updateData);
    return NextResponse.json(promo);
  } catch (error) {
    console.error("Promo update error:", error);
    return NextResponse.json({ error: "Failed to update promo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await promos.remove(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Promo delete error:", error);
    return NextResponse.json({ error: "Failed to delete promo" }, { status: 500 });
  }
}
