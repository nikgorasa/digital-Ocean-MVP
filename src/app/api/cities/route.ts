import { NextRequest, NextResponse } from "next/server";
import * as cities from "@/lib/db/cities";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search") || "";

    let data;
    if (search) {
      data = await cities.search(search);
    } else {
      data = await cities.findAll();
    }

    if (type === "domestic" || type === "international") {
      data = data.filter((c: any) => c.type === type);
    }

    const projected = data.map((c: any) => ({
      id: c.id,
      name: c.name,
      country: c.country,
      type: c.type,
      iata_code: c.iata_code,
    }));

    return NextResponse.json(projected);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
