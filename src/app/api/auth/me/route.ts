import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sanitizeUser } from "@/lib/auth-helpers";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (dbUser) {
        return NextResponse.json(sanitizeUser(dbUser as Record<string, unknown>));
      }
    }

    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  } catch (error) {
    console.error("Auth/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
