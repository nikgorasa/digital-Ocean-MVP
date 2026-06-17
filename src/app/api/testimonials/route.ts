import { NextResponse } from "next/server";
import * as content from "@/lib/db/content";

export async function GET() {
  try {
    const data = await content.findTestimonials();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}
