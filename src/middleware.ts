import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_API_ROUTES = [
  "/api/auth/[...all]",
  "/api/packages",
  "/api/packages/carousel",
  "/api/testimonials",
  "/api/value-propositions",
  "/api/navigation",
  "/api/footer-links",
  "/api/faq",
  "/api/faq/categories",
  "/api/categories",
  "/api/cities",
  "/api/cities/tbo",
  "/api/site-config",
  "/api/preferences/options",
  "/api/topup-amounts",
  "/api/roles",
  "/api/users/demo",
  "/api/tbo-hotels",
  "/api/tbo",
  "/api/tbo-flights",
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => {
    if (route.includes("[...all]")) {
      return pathname.startsWith("/api/auth/");
    }
    return pathname === route || pathname === route + "/";
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }

    const sessionToken =
      request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__Secure-better-auth.session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const sessionToken =
      request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__Secure-better-auth.session_token")?.value;

    if (!sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
