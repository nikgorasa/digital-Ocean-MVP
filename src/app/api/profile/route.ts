import { NextRequest, NextResponse } from "next/server";
import * as users from "@/lib/db/users";

export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await users.findByEmail(email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id, name, email: userEmail, role, avatar, loyaltyTier, loyaltyPoints, walletBalance, passengers, preferences, wishlist } = user as any;

    return NextResponse.json({ id, name, email: userEmail, role, avatar, loyaltyTier, loyaltyPoints, walletBalance, passengers, preferences, wishlist });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const email = request.headers.get("x-user-email");
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await users.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, email: newEmail, passengers, preferences, wishlist } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (newEmail !== undefined) updateData.email = newEmail;
    if (passengers !== undefined) updateData.passengers = passengers;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (wishlist !== undefined) updateData.wishlist = wishlist;

    const updated = await users.update((user as any).id, updateData);

    const { id, name: n, email: e, role, avatar, loyaltyTier, loyaltyPoints, walletBalance, passengers: p, preferences: pr, wishlist: w } = updated as any;

    return NextResponse.json({ id, name: n, email: e, role, avatar, loyaltyTier, loyaltyPoints, walletBalance, passengers: p, preferences: pr, wishlist: w });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
