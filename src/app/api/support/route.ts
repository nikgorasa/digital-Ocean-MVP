import { NextResponse } from "next/server";
import { getSupportResponse, SupportContext } from "@/lib/support";

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const supportContext: SupportContext = {
      user: context?.user,
      currentPage: context?.currentPage,
      conversationLength: context?.conversationLength || 0,
    };

    const response = getSupportResponse(message, supportContext);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Support error:", error);
    return NextResponse.json(
      { error: "Failed to process support request" },
      { status: 500 }
    );
  }
}
