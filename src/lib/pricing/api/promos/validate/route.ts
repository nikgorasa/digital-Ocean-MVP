import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode } from "../../../pricing-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, bookingAmount, category, userId } = body;

    if (!code || bookingAmount == null || !category || !userId) {
      return NextResponse.json(
        { error: "code, bookingAmount, category, and userId are required" },
        { status: 400 }
      );
    }

    const result = await validatePromoCode(code, bookingAmount, category, userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
