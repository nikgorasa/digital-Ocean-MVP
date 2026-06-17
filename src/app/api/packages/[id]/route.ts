import { NextRequest, NextResponse } from "next/server";
import * as packages from "@/lib/db/packages";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pkg = await packages.findById(id);

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Package fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch package" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice ? Number(body.originalPrice) : null;
    if (body.rating !== undefined) updateData.rating = Number(body.rating);
    if (body.provider !== undefined) updateData.provider = body.provider;
    if (body.overview !== undefined) updateData.overview = body.overview;
    if (body.itinerary !== undefined) updateData.itinerary = body.itinerary;
    if (body.inclusions !== undefined) updateData.inclusions = body.inclusions;
    if (body.exclusions !== undefined) updateData.exclusions = body.exclusions;
    if (body.importantNotes !== undefined) updateData.importantNotes = body.importantNotes;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const pkg = await packages.update(id, updateData);
    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Package update error:", error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await packages.update(id, { isActive: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Package delete error:", error);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
