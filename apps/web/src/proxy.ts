import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth-middleware";

export function proxy(request: NextRequest): NextResponse {
  return authMiddleware(request) ?? NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|sw\\.js|manifest\\.webmanifest).*)",
  ],
};
