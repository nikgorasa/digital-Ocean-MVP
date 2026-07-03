import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PAID", "OVERDUE", "CANCELLED"]).optional(),
  paidAmount: z.number().optional(),
  paymentRef: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.paidAmount !== undefined) updateData.paidAmount = parsed.data.paidAmount;
    if (parsed.data.paymentRef !== undefined) updateData.paymentRef = parsed.data.paymentRef;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
    if (parsed.data.status === "PAID") {
      updateData.paidAt = new Date();
      if (!parsed.data.paidAmount) updateData.paidAmount = invoice.totalAmount;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Invoice update error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
