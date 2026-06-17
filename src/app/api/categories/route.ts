import { NextResponse } from "next/server";
import * as packages from "@/lib/db/packages";

export async function GET() {
  try {
    const data = await packages.findCategories();
    const mapped = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      isActive: row.isactive,
      sortOrder: row.sortorder,
      badgeColor: row.badgecolor,
      badgeText: row.badgetext,
    }));
    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
