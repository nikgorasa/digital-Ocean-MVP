import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const topupSchema = z.object({
  companyId: z.string().min(1),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = topupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { companyId, amount, description } = parsed.data;

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const newBalance = company.walletBalance + amount;

    // Atomic: update wallet + create ledger entry
    const [updatedCompany] = await prisma.$transaction([
      prisma.company.update({
        where: { id: companyId },
        data: { walletBalance: newBalance },
      }),
      prisma.walletLedger.create({
        data: {
          companyId,
          type: "TOPUP",
          amount,
          balanceAfter: newBalance,
          referenceType: "ADMIN",
          description: description || `Top-up by admin`,
          performedBy: admin.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      walletBalance: updatedCompany.walletBalance,
      entry: { type: "TOPUP", amount, balanceAfter: newBalance },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Wallet topup error:", error);
    return NextResponse.json({ error: "Failed to top up wallet" }, { status: 500 });
  }
}
