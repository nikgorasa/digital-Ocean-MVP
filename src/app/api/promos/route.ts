import { NextRequest, NextResponse } from "next/server";
import * as promos from "@/lib/db/promo-codes";

export async function GET() {
  try {
    const data = await promos.findAll();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Promos fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch promos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, discountValue, type, description, minBookingValue } = body;

    if (!code || discountValue == null) {
      return NextResponse.json({ error: "Code and discount value are required" }, { status: 400 });
    }

    const promo = await promos.create({
      code: code.toUpperCase(),
      discountValue,
      type: type || "flat",
      description: description || "",
      minBookingValue: minBookingValue || 0,
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    console.error("Promo create error:", error);
    return NextResponse.json({ error: "Failed to create promo" }, { status: 500 });
  }
}
