import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { upsertConfig, invalidateCache } from "@/lib/config-service";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.configProvider.findMany({
      orderBy: { provider: "asc" },
    });
    const providers = rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      label: r.label,
      baseUrl: r.baseUrl,
      bookingUrl: r.bookingUrl,
      staticUrl: r.staticUrl,
      clientId: r.clientId,
      hasUsername: !!r.encryptedUsername,
      hasPassword: !!r.encryptedPassword,
      hasStaticUsername: !!r.encryptedStaticUsername,
      hasStaticPassword: !!r.encryptedStaticPassword,
      forceMock: r.forceMock,
      isActive: r.isActive,
      version: r.version,
      createdBy: r.createdBy,
      updatedBy: r.updatedBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    const envStatus = {
      hasEncryptionKey: !!process.env.CONFIG_ENCRYPTION_KEY,
      tboHotel: {
        hasEndpoint: !!process.env.TBO_ENDPOINT,
        endpointUrl: process.env.TBO_ENDPOINT || "https://affiliate.tektravels.com/HotelAPI",
        hasBookingEndpoint: !!process.env.TBO_BOOKING_ENDPOINT,
        bookingUrl: process.env.TBO_BOOKING_ENDPOINT || "https://HotelBE.tektravels.com/hotelservice.svc/rest",
        hasClientId: !!process.env.TBO_CLIENT_ID,
        hasUsername: !!process.env.TBO_USERNAME,
        hasPassword: !!process.env.TBO_PASSWORD,
        forceMock: process.env.TBO_HOTEL_FORCE_MOCK === "true",
      },
      tboHotelStatic: {
        hasEndpoint: !!process.env.TBO_STATIC_ENDPOINT,
        hasUsername: !!process.env.TBO_HOTEL_USERNAME,
        hasPassword: !!process.env.TBO_HOTEL_PASSWORD,
      },
      tboFlight: {
        hasClientId: !!process.env.TBO_CLIENT_ID,
        hasUsername: !!process.env.TBO_USERNAME,
        hasPassword: !!process.env.TBO_PASSWORD,
        forceMock: process.env.TBO_FLIGHT_FORCE_MOCK === "true",
      },
    };

    return NextResponse.json({ providers, envStatus });
  } catch (e) {
    console.error("Config fetch error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { provider, username, password, staticUsername, staticPassword, ...rest } = body;

    if (!provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }

    // 🛡 API Config Guard — reject misconfigured endpoint URLs
    if (provider === "tbo_hotel") {
      if (rest.baseUrl && !rest.baseUrl.includes("affiliate.tektravels.com")) {
        return NextResponse.json({
          error: `INVALID_CONFIG: tbo_hotel baseUrl must point to affiliate.tektravels.com/HotelAPI. Got: ${rest.baseUrl}`,
        }, { status: 422 });
      }
      if (rest.bookingUrl && !rest.bookingUrl.includes("HotelBE.tektravels.com")) {
        return NextResponse.json({
          error: `INVALID_CONFIG: tbo_hotel bookingUrl must point to HotelBE.tektravels.com/hotelservice.svc/rest. Got: ${rest.bookingUrl}`,
        }, { status: 422 });
      }
    }
    if (provider === "tbo_hotel_static") {
      if (rest.staticUrl && !rest.staticUrl.includes("api.tbotechnology.in")) {
        return NextResponse.json({
          error: `INVALID_CONFIG: tbo_hotel_static staticUrl must point to api.tbotechnology.in/TBOHolidays_HotelAPI. Got: ${rest.staticUrl}`,
        }, { status: 422 });
      }
    }

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "unknown";

    const result = await upsertConfig(provider, {
      ...rest,
      username: username ?? undefined,
      password: password ?? undefined,
      staticUsername: staticUsername ?? undefined,
      staticPassword: staticPassword ?? undefined,
      updatedBy: body.updatedBy || "admin",
    });

    await prisma.configAuditLog.create({
      data: {
        provider,
        action: "UPSERT",
        field: "all",
        performedBy: body.updatedBy || "admin",
        ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      provider: result.provider,
      version: result.version,
    });
  } catch (e) {
    console.error("Config upsert error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }

    const existing = await prisma.configProvider.findUnique({ where: { provider } });
    if (!existing) {
      return NextResponse.json({ error: `Provider '${provider}' not found` }, { status: 404 });
    }

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headersList.get("x-real-ip")
      || "unknown";

    await prisma.configProvider.delete({ where: { provider } });

    await prisma.configAuditLog.create({
      data: {
        provider,
        action: "DELETE",
        field: "all",
        performedBy: "admin",
        ipAddress,
      },
    });

    invalidateCache(provider);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Config delete error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}
