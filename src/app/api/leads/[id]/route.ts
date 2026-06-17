import { NextResponse } from "next/server";
import * as leads from "@/lib/db/leads";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stage, assignedTo, notes } = body;

    const updateData: any = {};
    if (stage) updateData.stage = stage;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;

    const lead = await leads.update(id, updateData);
    return NextResponse.json(lead);
  } catch (error) {
    console.error("Lead update error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
