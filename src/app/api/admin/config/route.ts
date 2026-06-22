import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { upsertConfig, invalidateCache } from "@/lib/config-service";
import { headers } from "next/headers";

export async function GET() {
  try {
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
    return NextResponse.json({ providers });
  } catch (e) {
    console.error("Config fetch error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, username, password, staticUsername, staticPassword, ...rest } = body;

    if (!provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
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
