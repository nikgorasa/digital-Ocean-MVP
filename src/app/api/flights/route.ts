import { NextRequest, NextResponse } from "next/server";
import * as flights from "@/lib/db/flights";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get("origin") || "";
    const destination = searchParams.get("destination") || "";

    const data = await flights.search(origin || undefined, destination || undefined);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 });
  }
}
