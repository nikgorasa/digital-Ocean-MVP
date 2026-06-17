import { NextResponse } from "next/server";
import { getTicket, updateTicket } from "@/lib/ticket/serverManager";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await getTicket(id);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const ticket = await updateTicket(id, body);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Failed to update ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
