import { NextRequest, NextResponse } from "next/server";
import * as companies from "@/lib/db/companies";

export async function GET() {
  try {
    const data = await companies.findAll();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Companies fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domain, discountRate, walletBalance } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const company = await companies.create({
      name,
      domain: domain || null,
      discountRate: discountRate || 0,
      walletBalance: walletBalance || 0,
      isActive: true,
    });

    return NextResponse.json(company, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
