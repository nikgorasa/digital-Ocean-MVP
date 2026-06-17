import { NextRequest, NextResponse } from "next/server";
import { isPrisma, prisma, supabaseAdmin } from "@/lib/db";

function normalizeType(raw: string): string {
  const t = raw.toUpperCase().trim();
  if (t.includes("HOTEL")) return "HOTEL";
  if (t.includes("FLIGHT")) return "FLIGHT";
  if (t.includes("PACKAGE") || t.includes("HOLIDAY")) return "PACKAGE";
  return t || "OTHER";
}

function calcCostBreakdown(originalPrice: number, discountApplied: number, promoCost: number) {
  // originalPrice = what customer would pay BEFORE any discount/promo
  // pricing-service.ts applies 15% default markup over TBO base: originalPrice = baseRate * 1.15
  // So costPrice (TBO price) = originalPrice / 1.15
  const costPrice = Math.round(originalPrice / 1.15);
  const markup = originalPrice - costPrice;
  const adminDiscount = discountApplied;
  const customerPays = originalPrice - adminDiscount - promoCost;
  const netEarnings = customerPays - costPrice;
  const markupPercent = costPrice > 0 ? Math.round((markup / costPrice) * 100) : 0;
  const marginPercent = originalPrice > 0 ? Math.round((netEarnings / originalPrice) * 100) : 0;
  return { costPrice, markup, markupPercent, adminDiscount, promoCost, customerPays, netEarnings, marginPercent };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly";
    const type = searchParams.get("type") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const now = new Date();
    let start: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
    } else {
      switch (period) {
        case "weekly": start = new Date(now); start.setDate(start.getDate() - 7); break;
        case "monthly": start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "quarterly": start = new Date(now); start.setMonth(start.getMonth() - 3); break;
        case "halfyearly": start = new Date(now); start.setMonth(start.getMonth() - 6); break;
        case "annual": start = new Date(now.getFullYear(), 0, 1); break;
        default: start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    const where: any = { bookedAt: { gte: start } };
    if (endDate) where.bookedAt.lte = new Date(endDate);

    if (isPrisma()) {
      const bookings = await prisma.booking.findMany({
        where,
        include: { payment: true, user: { select: { name: true, email: true } } },
        orderBy: { bookedAt: "desc" },
      });

      // Normalize types and calculate cost breakdown
      const enriched = bookings.map((b) => {
        const normalizedType = normalizeType(b.type);
        const breakdown = calcCostBreakdown(b.originalPrice || b.price, b.discountApplied || 0, b.promoCost || 0);
        return {
          id: b.id,
          rawType: b.type,
          type: normalizedType,
          itemName: b.itemName,
          providerOrAirline: b.providerOrAirline,
          price: b.price,
          originalPrice: b.originalPrice,
          discountApplied: b.discountApplied || 0,
          couponCodeUsed: b.couponCodeUsed,
          status: b.status,
          pnr: b.pnr,
          seatOrRoom: b.seatOrRoom,
          paxCount: b.paxCount,
          travelDates: b.travelDates,
          bookedAt: b.bookedAt,
          paymentStatus: b.paymentStatus,
          leadGuestPan: b.leadGuestPan,
          userName: b.user?.name || "N/A",
          userEmail: b.user?.email || "N/A",
          paymentMethod: b.payment?.method || "N/A",
          paymentGateway: b.payment?.gateway || "N/A",
          ...breakdown,
        };
      });

      const filtered = type !== "all" ? enriched.filter((b) => b.type === type) : enriched;

      // Aggregate by normalized type
      const byTypeMap: Record<string, { count: number; revenue: number; cost: number; markup: number; discount: number; promoCost: number; netEarnings: number }> = {};
      filtered.forEach((b) => {
        if (!byTypeMap[b.type]) byTypeMap[b.type] = { count: 0, revenue: 0, cost: 0, markup: 0, discount: 0, promoCost: 0, netEarnings: 0 };
        byTypeMap[b.type].count++;
        byTypeMap[b.type].revenue += b.price;
        byTypeMap[b.type].cost += b.costPrice;
        byTypeMap[b.type].markup += b.markup;
        byTypeMap[b.type].discount += b.discountApplied;
        byTypeMap[b.type].promoCost += b.promoCost;
        byTypeMap[b.type].netEarnings += b.netEarnings;
      });

      const summary = {
        totalBookings: filtered.length,
        totalRevenue: filtered.reduce((s, b) => s + b.price, 0),
        totalCost: filtered.reduce((s, b) => s + b.costPrice, 0),
        totalMarkup: filtered.reduce((s, b) => s + b.markup, 0),
        totalDiscount: filtered.reduce((s, b) => s + b.discountApplied, 0),
        totalPromoCost: filtered.reduce((s, b) => s + b.promoCost, 0),
        totalNetEarnings: filtered.reduce((s, b) => s + b.netEarnings, 0),
        cancelledBookings: filtered.filter((b) => b.status === "CANCELLED").length,
        cancelledRevenue: filtered.filter((b) => b.status === "CANCELLED").reduce((s, b) => s + b.price, 0),
        avgBookingValue: filtered.length > 0 ? Math.round(filtered.reduce((s, b) => s + b.price, 0) / filtered.length) : 0,
        avgMargin: filtered.length > 0 ? Math.round(filtered.reduce((s, b) => s + b.marginPercent, 0) / filtered.length) : 0,
      };

      const paymentMethods = await prisma.payment.groupBy({
        by: ["method"],
        _count: true,
        _sum: { amount: true },
      });

      // Promo usage summary
      const promoUsage = await prisma.booking.groupBy({
        by: ["couponCodeUsed"],
        where: { ...where, couponCodeUsed: { not: null } },
        _count: true,
        _sum: { promoCost: true, price: true },
      });

      return NextResponse.json({
        bookings: filtered,
        summary,
        byType: Object.entries(byTypeMap).map(([type, data]) => ({ type, ...data })),
        paymentMethods: paymentMethods.map((p) => ({ method: p.method, count: Number(p._count), total: Number(p._sum.amount || 0) })),
        promoUsage: promoUsage.filter((p) => p.couponCodeUsed).map((p) => ({
          code: p.couponCodeUsed,
          count: Number(p._count),
          totalDiscount: Number(p._sum.promoCost || 0),
          totalRevenue: Number(p._sum.price || 0),
        })),
      });
    }

    // Supabase fallback
    const { data: bookings } = await supabaseAdmin
      .from("Booking")
      .select("*, user:User(name, email), payment:Payment(method, gateway, amount)")
      .gte("bookedAt", start.toISOString())
      .order("bookedAt", { ascending: false });

    const enriched = (bookings || []).map((b: any) => {
      const normalizedType = normalizeType(b.type);
      const breakdown = calcCostBreakdown(b.originalPrice || b.price, b.discountApplied || 0, b.promoCost || 0);
      return { ...b, rawType: b.type, type: normalizedType, userName: b.user?.name || "N/A", userEmail: b.user?.email || "N/A", paymentMethod: b.payment?.method || "N/A", ...breakdown };
    });

    const filtered = type !== "all" ? enriched.filter((b: any) => b.type === type) : enriched;

    const byTypeMap: Record<string, { count: number; revenue: number; cost: number; markup: number; discount: number; promoCost: number; netEarnings: number }> = {};
    filtered.forEach((b: any) => {
      if (!byTypeMap[b.type]) byTypeMap[b.type] = { count: 0, revenue: 0, cost: 0, markup: 0, discount: 0, promoCost: 0, netEarnings: 0 };
      byTypeMap[b.type].count++;
      byTypeMap[b.type].revenue += b.price;
      byTypeMap[b.type].cost += b.costPrice;
      byTypeMap[b.type].markup += b.markup;
      byTypeMap[b.type].discount += b.discountApplied;
      byTypeMap[b.type].promoCost += b.promoCost;
      byTypeMap[b.type].netEarnings += b.netEarnings;
    });

    return NextResponse.json({
      bookings: filtered,
      summary: {
        totalBookings: filtered.length,
        totalRevenue: filtered.reduce((s: number, b: any) => s + b.price, 0),
        totalCost: filtered.reduce((s: number, b: any) => s + b.costPrice, 0),
        totalMarkup: filtered.reduce((s: number, b: any) => s + b.markup, 0),
        totalDiscount: filtered.reduce((s: number, b: any) => s + b.discountApplied, 0),
        totalPromoCost: filtered.reduce((s: number, b: any) => s + b.promoCost, 0),
        totalNetEarnings: filtered.reduce((s: number, b: any) => s + b.netEarnings, 0),
        cancelledBookings: filtered.filter((b: any) => b.status === "CANCELLED").length,
        cancelledRevenue: filtered.filter((b: any) => b.status === "CANCELLED").reduce((s: number, b: any) => s + b.price, 0),
        avgBookingValue: filtered.length > 0 ? Math.round(filtered.reduce((s: number, b: any) => s + b.price, 0) / filtered.length) : 0,
        avgMargin: filtered.length > 0 ? Math.round(filtered.reduce((s: number, b: any) => s + b.marginPercent, 0) / filtered.length) : 0,
      },
      byType: Object.entries(byTypeMap).map(([type, data]) => ({ type, ...data })),
      paymentMethods: [],
      promoUsage: [],
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
