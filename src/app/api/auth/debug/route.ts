import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const h = await headers();
  const cookie = h.get("cookie");
  const betterAuthUrl = process.env.BETTER_AUTH_URL;
  const nodeEnv = process.env.NODE_ENV;
  const vercelUrl = process.env.VERCEL_URL;
  const vercelEnv = process.env.VERCEL_ENV;

  const cookiePreview = cookie ? cookie.substring(0, 200) : null;
  const hasSessionCookie = cookie?.includes("better-auth.session_token") || false;
  const hasSecureSessionCookie = cookie?.includes("__Secure-better-auth.session_token") || false;

  let sessionResult: unknown = null;
  let sessionError: string | null = null;
  try {
    sessionResult = await auth.api.getSession({ headers: h });
  } catch (e: unknown) {
    sessionError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    betterAuthUrl,
    nodeEnv,
    vercelUrl,
    vercelEnv,
    hasCookie: !!cookie,
    cookiePreview,
    hasSessionCookie,
    hasSecureSessionCookie,
    sessionResult,
    sessionError,
  });
}
