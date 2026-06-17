import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // With Better Auth, OAuth callbacks are handled by /api/auth/[...all]
  // This route just redirects to the main page after auth
  if (code) {
    // The code will be handled by Better Auth's callback
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
