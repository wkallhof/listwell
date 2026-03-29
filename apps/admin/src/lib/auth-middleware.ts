import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_ROUTES = ["/login", "/api/"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export function authMiddleware(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    const sessionCookie = getSessionCookie(request);
    if (sessionCookie && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return undefined;
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return undefined;
}
