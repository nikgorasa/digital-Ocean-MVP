import { NextRequest, NextResponse } from "next/server";
 import { getPaymentStatus } from "@/lib/payment";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const status = await getPaymentStatus(id);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get payment status" },
      { status: 500 }
    );
  }
}
