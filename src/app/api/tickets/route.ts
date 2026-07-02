import { NextResponse } from "next/server";
import { createTicket, getAllTickets, getUserTickets, getTicketStats } from "@/lib/ticket/serverManager";
import { getCurrentUser, requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stats = searchParams.get("stats");

    if (stats === "true") {
      await requireAdmin();
      const ticketStats = await getTicketStats();
      return NextResponse.json(ticketStats);
    }

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "CUSTOMER_SUPPORT";
    if (isAdmin) {
      const allTickets = await getAllTickets();
      return NextResponse.json(allTickets);
    }

    const userTickets = await getUserTickets(user.id);
    return NextResponse.json(userTickets);
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, category, priority, userPhone, bookingRef } = body;

    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: "Subject, description, and category are required" },
        { status: 400 }
      );
    }

    const ticket = await createTicket({
      subject,
      description,
      category,
      priority: priority || "medium",
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: userPhone || null,
      bookingRef: bookingRef || null,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
