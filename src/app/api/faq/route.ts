import { NextRequest, NextResponse } from "next/server";
import * as content from "@/lib/db/content";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";

    let faqs = await content.findFAQs();

    if (keyword) {
      faqs = faqs.filter((f: any) =>
        f.keyword?.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    return NextResponse.json(faqs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}
