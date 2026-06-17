import { NextResponse } from "next/server";
import * as packages from "@/lib/db/packages";

export async function GET() {
  try {
    const data = await packages.findAll();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Packages error:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, duration, price, originalPrice, rating, provider, overview, itinerary, inclusions, exclusions, importantNotes, images, status, category } = body;

    if (!title || !duration || price === undefined) {
      return NextResponse.json(
        { error: "Title, duration, and price are required" },
        { status: 400 }
      );
    }

    const pkg = await packages.create({
      title,
      duration,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      rating: rating ? Number(rating) : 4.5,
      provider: provider || "GoRASA Direct",
      overview: overview || "{}",
      itinerary: itinerary || "{}",
      inclusions: inclusions || "[]",
      exclusions: exclusions || "[]",
      importantNotes: importantNotes || "{}",
      images: images || "[]",
      status: status || "DRAFT",
      category: category || "TOP_DEALS",
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    console.error("Package create error:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
