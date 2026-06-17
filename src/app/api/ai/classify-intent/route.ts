import { NextResponse } from "next/server";
import { routeUserMessage } from "@/lib/ai/intent/router";

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await routeUserMessage(message, context);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Intent classification error:", error);
    return NextResponse.json(
      { error: "Failed to classify intent" },
      { status: 500 }
    );
  }
}
