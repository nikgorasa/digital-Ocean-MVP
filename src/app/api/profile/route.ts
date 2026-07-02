import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, sanitizeUser } from "@/lib/auth-helpers";
import * as users from "@/lib/db/users";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(sanitizeUser(user as Record<string, unknown>));
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, passengers, preferences, wishlist } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (passengers !== undefined) updateData.passengers = passengers;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (wishlist !== undefined) updateData.wishlist = wishlist;

    const updated = await users.update(user.id, updateData);

    return NextResponse.json(sanitizeUser(updated as Record<string, unknown>));
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
