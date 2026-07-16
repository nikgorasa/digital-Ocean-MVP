import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const SAFE_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  companyId: true,
  company: true,
  isActive: true,
  createdAt: true,
  walletBalance: true,
  loyaltyPoints: true,
  loyaltyTier: true,
  passengers: true,
  preferences: true,
  wishlist: true,
} as const;

type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  companyId: string | null;
  company: { name: string } | null;
  isActive: boolean;
  createdAt: Date;
  walletBalance: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  passengers: unknown;
  preferences: unknown;
  wishlist: unknown;
};

export function sanitizeUser(user: Record<string, unknown>): SafeUser {
  const safe: Record<string, unknown> = {};
  for (const key of Object.keys(SAFE_USER_FIELDS)) {
    if (key in user) safe[key] = user[key];
  }
  return safe as SafeUser;
}

export async function getSession() {
  const h = await headers();
  return auth.api.getSession({ headers: h });
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { company: { select: { name: true } } },
  });

  if (user) return user;

  // Auto-assign company by email domain
  const emailDomain = session.user.email.split("@")[1]?.toLowerCase();
  let matchedCompanyId: string | null = null;
  if (emailDomain) {
    const matchedCompany = await prisma.company.findFirst({
      where: {
        domain: { equals: emailDomain, mode: "insensitive" },
        isActive: true,
      },
    });
    if (matchedCompany) {
      matchedCompanyId = matchedCompany.id;
      console.log(`[auto-assign] User ${session.user.email} matched company domain ${emailDomain} → ${matchedCompany.name}`);
    }
  }

  return prisma.user.create({
    data: {
      email: session.user.email,
      name: session.user.name || session.user.email.split("@")[0],
      role: matchedCompanyId ? "CORPORATE_USER" : "CUSTOMER",
      companyId: matchedCompanyId,
      walletBalance: 0,
      loyaltyPoints: 0,
      loyaltyTier: "Silver",
      isActive: true,
    },
    include: { company: { select: { name: true } } },
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
