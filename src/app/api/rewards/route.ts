import { NextRequest, NextResponse } from "next/server";
import * as rewards from "@/lib/db/rewards";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const all = url.searchParams.get("all") === "true";

  try {
    const data = all ? await rewards.findAllAll() : await rewards.findAll();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Rewards fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, pointsCost, category, imageColor, icon, isActive } = body;

    if (!name || pointsCost == null) {
      return NextResponse.json({ error: "name and pointsCost are required" }, { status: 400 });
    }

    const reward = await rewards.create({
      name,
      description: description || "",
      pointsCost,
      category: category || "General",
      imageColor: imageColor || "bg-gradient-to-br from-amber-400 to-orange-500",
      icon: icon || "Gift",
      isActive: isActive !== false,
    });

    return NextResponse.json(reward, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
