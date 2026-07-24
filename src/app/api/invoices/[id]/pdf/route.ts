import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        booking: {
          select: {
            id: true,
            itemName: true,
            type: true,
            pnr: true,
            travelDates: true,
            userId: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // Check access: admin or booking owner
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isOwner = invoice.booking?.user?.email === user.email;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const doc = generateInvoicePDF({
      invoiceNumber: invoice.number,
      issuedAt: invoice.issuedAt.toISOString().split("T")[0],
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split("T")[0] : "PAID",
      status: invoice.status,
      companyName: (invoice as any).company?.name || "N/A",
      bookingItem: (invoice as any).booking?.itemName || "N/A",
      bookingType: (invoice as any).booking?.type || "N/A",
      bookingPnr: (invoice as any).booking?.pnr || undefined,
      travelDates: (invoice as any).booking?.travelDates || undefined,
      guestName: (invoice as any).booking?.user?.name || "Guest",
      amount: invoice.amount,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount || undefined,
      paymentRef: invoice.paymentRef || undefined,
    });

    const pdfBuffer = doc.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
      },
    });
  } catch (e) {
    console.error("Invoice PDF error:", e);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
