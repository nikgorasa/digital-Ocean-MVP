import { NextRequest, NextResponse } from "next/server";
import { addTicketNote, getTicketNotes } from "@/lib/ticket/serverManager";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notes = await getTicketNotes(id, true);
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, author, authorRole, isInternal } = body;

    if (!content || !author) {
      return NextResponse.json({ error: "content and author are required" }, { status: 400 });
    }

    const note = await addTicketNote({
      ticketId: id,
      author,
      authorRole: authorRole || "agent",
      content,
      isInternal: isInternal || false,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Failed to create note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
