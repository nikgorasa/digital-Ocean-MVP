import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeUser } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && !password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }

    return NextResponse.json(sanitizeUser(user as Record<string, unknown>));
  } catch (error) {
    console.error("Auth/login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
