import { NextRequest, NextResponse } from "next/server";
import * as rewards from "@/lib/db/rewards";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const reward = await rewards.update(id, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(reward);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await rewards.remove(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
