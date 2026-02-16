import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_ROUTES = ["/login", "/api/auth"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export function authMiddleware(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    // Redirect authenticated users away from login
    const sessionCookie = getSessionCookie(request);
    if (sessionCookie && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return undefined;
  }

  // Protect all other routes
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return undefined;
}
