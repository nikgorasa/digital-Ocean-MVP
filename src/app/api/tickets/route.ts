import { NextResponse } from "next/server";
import { createTicket, getAllTickets, getUserTickets, getTicketStats } from "@/lib/ticket/serverManager";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const stats = searchParams.get("stats");

    if (stats === "true") {
      const ticketStats = await getTicketStats();
      return NextResponse.json(ticketStats);
    }

    if (userId) {
      const tickets = await getUserTickets(userId);
      return NextResponse.json(tickets);
    }

    const tickets = await getAllTickets();
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { subject, description, category, priority, userId, userName, userEmail, userPhone, bookingRef } = body;

    if (!subject || !description || !category || !userId || !userName || !userEmail) {
      return NextResponse.json(
        { error: "Subject, description, category, userId, userName, and userEmail are required" },
        { status: 400 }
      );
    }

    const ticket = await createTicket({
      subject,
      description,
      category,
      priority,
      userId,
      userName,
      userEmail,
      userPhone,
      bookingRef,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
