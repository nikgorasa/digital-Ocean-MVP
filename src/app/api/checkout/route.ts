import { NextRequest, NextResponse } from "next/server";
import { createCheckout, PAYMENT_CONFIG } from "@/lib/payment";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCorporateDiscount } from "@/lib/pricing";
import { sendEmail, emailTemplates } from "@/lib/email";

const checkoutSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  gateway: z.enum(["zaakpay"]).optional(),
  acceptPriceChange: z.boolean().optional(),
  mockScenario: z.enum(["success", "failure", "timeout", "random"]).optional(),
});

async function getBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      price: true,
      status: true,
      type: true,
      expiresAt: true,
      travelDates: true,
      itemName: true,
      validatedPrice: true,
      priceRevalidatedAt: true,
      userId: true,
      metadata: true,
      baseRate: true,
      markupAmount: true,
      promoCost: true,
      corporateDiscount: true,
      discountApplied: true,
      totalDiscount: true,
      supplierBookingRef: true,
    },
  });
}

async function updateBookingPrice(bookingId: string, newPrice: number, priceChange: number) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      validatedPrice: newPrice,
      priceRevalidatedAt: new Date(),
      priceChangeAmount: priceChange,
      price: newPrice,
    },
  });
}

async function markBookingExpired(bookingId: string) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'EXPIRED', expiredAt: new Date() },
  });
}

function revalidatePrice(booking: { price: number }): { available: boolean; newPrice: number; reason?: string } {
  if (PAYMENT_CONFIG.mock) {
    const rand = Math.random();
    if (rand > 0.85) {
      const increase = Math.round(booking.price * 0.05);
      return { available: true, newPrice: booking.price + increase };
    } else if (rand > 0.7) {
      const decrease = Math.round(booking.price * 0.03);
      return { available: true, newPrice: booking.price - decrease };
    }
    return { available: true, newPrice: booking.price };
  }
  return { available: true, newPrice: booking.price };
}

function generateInvoiceNumber(): string {
  const date = new Date();
  const prefix = `INV${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { bookingId, gateway, acceptPriceChange } = parsed.data;
    const booking = await getBooking(bookingId);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json({
        error: `Booking is ${booking.status.toLowerCase()}. Only pending bookings can be paid.`,
      }, { status: 400 });
    }

    if (booking.expiresAt) {
      const expiresAt = new Date(booking.expiresAt);
      if (expiresAt < new Date()) {
        await markBookingExpired(bookingId);
        return NextResponse.json({
          error: "Booking has expired. Please create a new booking.",
          expired: true,
        }, { status: 400 });
      }
    }

    // Reject bookings without supplier confirmation (ghost bookings)
    if (!booking.supplierBookingRef && booking.type === "FLIGHT") {
      return NextResponse.json({
        error: "This booking was not confirmed by the airline. Please book again.",
        ghostBooking: true,
      }, { status: 400 });
    }

    // Reject demo bookings from real checkout
    const bookingMeta = booking.metadata as Record<string, unknown> | null;
    if (bookingMeta?.isDemo) {
      return NextResponse.json({
        error: "Demo bookings cannot be checked out. Use AdminDemoPanel to simulate payment.",
        isDemo: true,
      }, { status: 400 });
    }

    // ── CORPORATE CHECKOUT ──────────────────────────────────────────
    if (user.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
      });

      if (!company || !company.isActive) {
        return NextResponse.json(
          { error: "Your company account is inactive. Contact support." },
          { status: 403 }
        );
      }

      // Apply corporate discount
      const category = booking.type === "HOTEL" ? "HOTEL" : booking.type === "FLIGHT" ? "FLIGHT" : "ALL";
      const remainingMarkup = Math.max(0, (booking.markupAmount || 0) - (booking.promoCost || 0));
      const corporateDiscount = await getCorporateDiscount(
        user.companyId,
        category,
        undefined,
        booking.price,
        remainingMarkup
      );

      const finalAmount = corporateDiscount.finalPrice;

      // DISC-05: Stacking enforcement — total discount can never exceed markup
      const promoDiscountAmt = booking.promoCost || 0;
      const adminDiscountAmt = booking.discountApplied || 0;
      const corporateDiscountAmt = corporateDiscount.discountAmount;
      const totalDiscountRaw = promoDiscountAmt + corporateDiscountAmt + adminDiscountAmt;
      const markup = booking.markupAmount || 0;
      let totalDiscount = totalDiscountRaw;
      if (totalDiscountRaw > markup && markup > 0) {
        totalDiscount = markup;
      }

      // Calculate tax based on company tax rate
      const taxRate = company.taxRate ?? 0;
      const taxAmount = Math.round(finalAmount * taxRate) / 100;
      const totalWithTax = finalAmount + taxAmount;

      // Check wallet balance (walletBalance + creditLimit = available balance)
      const availableBalance = company.walletBalance + (company.creditLimit || 0);
      if (availableBalance < totalWithTax) {
        const shortfall = totalWithTax - availableBalance;
        return NextResponse.json({
          error: "Insufficient company credit",
          shortfall,
          walletBalance: company.walletBalance,
          creditLimit: company.creditLimit || 0,
          availableBalance,
          required: totalWithTax,
        }, { status: 400 });
      }

      // Set due date based on company payment terms
      const paymentTermsDays = company.paymentTermsDays ?? 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentTermsDays);
      const invoiceNumber = generateInvoiceNumber();

      const [updatedCompany] = await prisma.$transaction([
        // Deduct wallet
        prisma.company.update({
          where: { id: user.companyId },
          data: { walletBalance: { decrement: totalWithTax } },
        }),
        // Wallet ledger entry
        prisma.walletLedger.create({
          data: {
            companyId: user.companyId,
            type: "DEBIT",
            amount: -totalWithTax,
            balanceAfter: company.walletBalance - totalWithTax,
            referenceType: "BOOKING",
            referenceId: bookingId,
            description: `Booking: ${booking.itemName}`,
            performedBy: user.id,
          },
        }),
        // Confirm booking
        prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "CONFIRMED",
            paymentStatus: "COMPLETED",
            paymentMethod: "corporate_wallet",
            confirmedAt: new Date(),
            companyId: user.companyId,
            corporateDiscount: corporateDiscount.discountAmount,
            totalDiscount,
            metadata: {
              ...((booking.metadata as Record<string, unknown>) || {}),
              totalDiscount,
            },
          },
        }),
        // Create payment record
        prisma.payment.create({
          data: {
            bookingId,
            amount: totalWithTax,
            method: "corporate_wallet",
            gateway: "corporate",
            status: "COMPLETED",
          },
        }),
        // Create invoice
        prisma.invoice.create({
          data: {
            companyId: user.companyId,
            bookingId,
            number: invoiceNumber,
            amount: finalAmount,
            taxAmount,
            totalAmount: totalWithTax,
            status: "PAID",
            dueDate,
            paidAt: new Date(),
            paidAmount: totalWithTax,
          },
        }),
      ]);

      // Send invoice email (non-blocking)
      const dueDateStr = dueDate.toISOString().split("T")[0];
      sendEmail({
        to: user.email,
        ...emailTemplates.invoiceIssued({
          companyName: company.name,
          invoiceNumber,
          bookingItem: booking.itemName,
          amount: finalAmount,
          taxAmount,
          totalAmount: totalWithTax,
          dueDate: dueDateStr,
        }),
      }).catch(e => console.error("[Email] Invoice email failed:", e));

      return NextResponse.json({
        success: true,
        bookingId,
        paymentMethod: "corporate_wallet",
        corporateDiscount: corporateDiscount.discountAmount,
        corporateRuleName: corporateDiscount.ruleName,
        finalAmount: totalWithTax,
        taxAmount,
        walletBalance: updatedCompany.walletBalance,
        creditLimit: company.creditLimit || 0,
        availableBalance: updatedCompany.walletBalance + (company.creditLimit || 0),
        invoiceNumber,
        dueDate: dueDate.toISOString(),
      });
    }

    // ── STANDARD GATEWAY CHECKOUT ───────────────────────────────────
    const selectedGateway = gateway || PAYMENT_CONFIG.gateway;

    const revalidation = revalidatePrice(booking);

    if (!revalidation.available) {
      await markBookingExpired(bookingId);
      return NextResponse.json({
        error: revalidation.reason || "This booking is no longer available.",
        unavailable: true,
      }, { status: 400 });
    }

    const priceChange = revalidation.newPrice - booking.price;

    if (Math.abs(priceChange) > 1 && !acceptPriceChange) {
      return NextResponse.json({
        priceChanged: true,
        oldPrice: booking.price,
        newPrice: revalidation.newPrice,
        priceChange: priceChange,
        itemName: booking.itemName,
      });
    }

    if (Math.abs(priceChange) > 1 && acceptPriceChange) {
      await updateBookingPrice(bookingId, revalidation.newPrice, priceChange);
    }

    // DISC-05: Stacking enforcement — clamp totalDiscount to markup
    const promoDiscountAmtStd = booking.promoCost || 0;
    const corporateDiscountAmtStd = booking.corporateDiscount || 0;
    const adminDiscountAmtStd = booking.discountApplied || 0;
    const totalDiscountRawStd = promoDiscountAmtStd + corporateDiscountAmtStd + adminDiscountAmtStd;
    const markupStd = booking.markupAmount || 0;
    if (totalDiscountRawStd > markupStd && markupStd > 0) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { totalDiscount: markupStd },
      });
    } else if (booking.totalDiscount !== totalDiscountRawStd) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { totalDiscount: totalDiscountRawStd },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const result = await createCheckout({
      bookingId,
      amount: revalidation.newPrice,
      gateway: selectedGateway,
      userEmail: user.email,
      appUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
