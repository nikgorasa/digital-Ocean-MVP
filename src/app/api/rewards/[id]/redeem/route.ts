import { NextRequest, NextResponse } from "next/server";
import * as rewards from "@/lib/db/rewards";
import * as users from "@/lib/db/users";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rewardId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const reward = await rewards.findById(rewardId);
    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    const user = await users.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if ((user as any).loyaltyPoints < (reward as any).pointsCost) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
    }

    const redemption = await rewards.redeem(userId, rewardId, (reward as any).pointsCost);
    return NextResponse.json(redemption, { status: 201 });
  } catch (error) {
    console.error("Redemption error:", error);
    return NextResponse.json({ error: "Failed to redeem reward" }, { status: 500 });
  }
}
