import { NextRequest, NextResponse } from "next/server";
import * as content from "@/lib/db/content";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    const config = await content.findSiteConfig();

    if (key) {
      return NextResponse.json({ [key]: config[key] || "" });
    }

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
