import { NextResponse } from "next/server";
import { generateHolidayResponse } from "@/lib/ai/holidayPlannerAI";

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const response = await generateHolidayResponse(messages, context);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Holiday plan error:", error);
    return NextResponse.json(
      { error: "Failed to generate holiday plan" },
      { status: 500 }
    );
  }
}
