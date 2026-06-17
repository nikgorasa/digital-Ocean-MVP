import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");
    const environment = searchParams.get("environment");
    const requestId = searchParams.get("requestId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "500");
    const dbProvider = process.env.DATABASE_PROVIDER || 'supabase';

    if (dbProvider === 'prisma') {
      // Use Prisma for DEV/QA (NEON)
      const where: any = {};
      if (provider) where.provider = provider;
      if (status) where.status_code = parseInt(status);
      if (environment) where.environment = environment;
      if (requestId) where.request_id = requestId;
      if (from || to) {
        where.created_at = {};
        if (from) where.created_at.gte = new Date(from);
        if (to) where.created_at.lte = new Date(to);
      }

      const data = await (prisma as any).apiLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return NextResponse.json({ logs: data || [] });
    } else {
      // Use Supabase for Production (with RLS enforced via server client)
      const supabase = await createClient();
      let query = supabase
        .from("api_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (provider) query = query.eq("provider", provider);
      if (status) query = query.eq("status_code", parseInt(status));
      if (environment) query = query.eq("environment", environment);
      if (requestId) query = query.eq("request_id", requestId);
      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", to);

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
      }

      return NextResponse.json({ logs: data || [] });
    }
  } catch (e) {
    console.error("API logs fetch error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
