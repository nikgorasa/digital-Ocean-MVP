import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { findAllPaginated, aggregateRevenue } from "@/lib/db/bookings";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const sortBy = searchParams.get("sortBy") || "bookedAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;

    const { bookings, total } = await findAllPaginated({
      skip, take: limit, search, type, status, paymentStatus, sortBy, sortOrder,
    });

    const statsWhere = buildWhere(search, type, status, paymentStatus);
    const bookingStats = await aggregateRevenue(statsWhere);

    return NextResponse.json({
      bookings, total, page, limit,
      stats: {
        totalRevenue: bookingStats.totalRevenue,
        totalBookings: bookingStats.count,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin bookings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

function buildWhere(
  search?: string, type?: string, status?: string, paymentStatus?: string,
) {
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { itemName: { contains: search, mode: "insensitive" } },
      { pnr: { contains: search, mode: "insensitive" } },
      { providerOrAirline: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (type && type !== "ALL") where.type = type;
  if (status && status !== "ALL") where.status = status;
  if (paymentStatus && paymentStatus !== "ALL") where.paymentStatus = paymentStatus;
  return where;
}
