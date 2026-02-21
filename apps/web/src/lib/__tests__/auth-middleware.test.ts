// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock better-auth/cookies
vi.mock("better-auth/cookies", () => ({
  getSessionCookie: vi.fn(),
}));

import { getSessionCookie } from "better-auth/cookies";
import { authMiddleware } from "@/lib/auth-middleware";

const mockedGetSessionCookie = vi.mocked(getSessionCookie);

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("authMiddleware", () => {
  it("redirects unauthenticated users to /login", () => {
    mockedGetSessionCookie.mockReturnValue(null);

    const result = authMiddleware(createRequest("/"));
    expect(result?.status).toBe(307);
    expect(result?.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("allows authenticated users to access protected routes", () => {
    mockedGetSessionCookie.mockReturnValue("session-token");

    const result = authMiddleware(createRequest("/"));
    expect(result).toBeUndefined();
  });

  it("allows unauthenticated users to access /login", () => {
    mockedGetSessionCookie.mockReturnValue(null);

    const result = authMiddleware(createRequest("/login"));
    expect(result).toBeUndefined();
  });

  it("redirects authenticated users from /login to /", () => {
    mockedGetSessionCookie.mockReturnValue("session-token");

    const result = authMiddleware(createRequest("/login"));
    expect(result?.status).toBe(307);
    expect(result?.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("allows unauthenticated access to /api/ routes", () => {
    mockedGetSessionCookie.mockReturnValue(null);

    const result = authMiddleware(createRequest("/api/auth/signin"));
    expect(result).toBeUndefined();
  });

  it("allows unauthenticated access to /api/listings", () => {
    mockedGetSessionCookie.mockReturnValue(null);

    const result = authMiddleware(createRequest("/api/listings"));
    expect(result).toBeUndefined();
  });

  it("redirects unauthenticated users from nested protected routes", () => {
    mockedGetSessionCookie.mockReturnValue(null);

    const result = authMiddleware(createRequest("/listings/abc123"));
    expect(result?.status).toBe(307);
    expect(result?.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
