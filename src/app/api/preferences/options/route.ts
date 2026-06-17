import { NextRequest, NextResponse } from "next/server";
import * as content from "@/lib/db/content";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let data = await content.findPreferenceOptions();

    if (category) {
      data = data.filter((o: any) => o.category === category);
    }

    const mapped = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      isActive: row.isactive,
      sortOrder: row.sortorder,
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
