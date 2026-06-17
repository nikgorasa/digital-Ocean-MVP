import { NextRequest, NextResponse } from "next/server";
import { isPrisma, prisma, supabaseAdmin } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    let rate;
    if (isPrisma()) {
      rate = await prisma.corporateRate.update({
        where: { id },
        data: { ...body, updatedAt: new Date().toISOString() },
      });
    } else {
      const { data } = await supabaseAdmin
        .from('CorporateRate')
        .update({ ...body, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      rate = data;
    }

    return NextResponse.json(rate);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (isPrisma()) {
      await prisma.corporateRate.delete({ where: { id } });
    } else {
      await supabaseAdmin.from('CorporateRate').delete().eq('id', id);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
