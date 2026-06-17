import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Admin routes are protected by client-side auth in admin/layout.tsx
  // No server-side middleware check needed — the layout checks user role
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
