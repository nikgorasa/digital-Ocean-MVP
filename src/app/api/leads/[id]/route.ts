import { NextResponse } from "next/server";
import * as leads from "@/lib/db/leads";
import { requireAdmin } from "@/lib/auth-helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { stage, assignedTo, notes } = body;

    const updateData: Record<string, unknown> = {};
    if (stage) updateData.stage = stage;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;

    const lead = await leads.update(id, updateData);
    return NextResponse.json(lead);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Lead update error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
