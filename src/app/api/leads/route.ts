import { NextResponse } from "next/server";
import * as leads from "@/lib/db/leads";

export async function GET() {
  try {
    const data = await leads.findAll();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Leads error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination, travelerName, travelerEmail, travelerPhone, numberOfDays, inclusions, specificDemands, notes, source } = body;

    if (!destination || !travelerName || !travelerEmail) {
      return NextResponse.json(
        { error: "Destination, traveler name, and email are required" },
        { status: 400 }
      );
    }

    const lead = await leads.create({
      destination,
      travelerName,
      travelerEmail,
      travelerPhone,
      numberOfDays,
      inclusions,
      specificDemands,
      notes,
      source: source || "manual",
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Lead create error:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
