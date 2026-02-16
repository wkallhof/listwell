// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// Since this is a Server Component, we test the data flow and exports
// rather than rendering with RTL (which requires a client environment)

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve(
      new Headers({ cookie: "better-auth.session_token=test" }),
    ),
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

describe("FeedPage", () => {
  it("exports a default function", async () => {
    const mod = await import("@/app/(authenticated)/page");
    expect(typeof mod.default).toBe("function");
  });

  it("redirects to /login when no session", async () => {
    mockGetSession.mockResolvedValue(null);

    const mod = await import("@/app/(authenticated)/page");

    await expect(mod.default()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
