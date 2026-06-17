import { NextResponse } from "next/server";
import * as content from "@/lib/db/content";

export async function GET() {
  try {
    const data = await content.findNavigation();
    const mapped = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      isActive: row.isactive,
      sortOrder: row.sortorder,
      requiredRole: row.requiredrole,
    }));
    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
