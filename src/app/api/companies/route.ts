import { NextRequest, NextResponse } from "next/server";
import * as companies from "@/lib/db/companies";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAdmin();
    const data = await companies.findAll();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Companies fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, domain, discountRate, walletBalance, creditLimit } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const company = await companies.create({
      name,
      domain: domain || null,
      discountRate: discountRate || 0,
      walletBalance: walletBalance || 0,
      creditLimit: creditLimit || 0,
      isActive: true,
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
