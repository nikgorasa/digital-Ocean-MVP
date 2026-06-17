import { NextResponse } from "next/server";
import { isPrisma, prisma, supabaseAdmin } from "@/lib/db";

export async function GET() {
  try {
    let data;
    if (isPrisma()) {
      data = await prisma.role.findMany({ where: { isactive: true } });
    } else {
      const { data: roles } = await supabaseAdmin
        .from('Role')
        .select('*')
        .eq('isactive', true);
      data = roles || [];
    }
    const mapped = (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      isActive: row.isactive,
    }));
    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
