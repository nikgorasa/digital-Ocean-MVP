import { NextResponse } from "next/server";
import * as leads from "@/lib/db/leads";

export async function GET() {
  try {
    const data = await leads.findStages();
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
