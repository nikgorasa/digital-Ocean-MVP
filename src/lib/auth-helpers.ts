import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function getSession() {
  const h = await headers();
  return auth.api.getSession({ headers: h });
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (user) return user;

  return prisma.user.create({
    data: {
      email: session.user.email,
      name: session.user.name || session.user.email.split("@")[0],
      role: "CUSTOMER",
      walletBalance: 0,
      loyaltyPoints: 0,
      loyaltyTier: "Silver",
      isActive: true,
    },
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
