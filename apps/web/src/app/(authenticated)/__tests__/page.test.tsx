// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mockApiFetch = vi.fn();
vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
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

  it("redirects to /login when API returns 401", async () => {
    mockApiFetch.mockResolvedValue(
      new Response(null, { status: 401 }),
    );

    const mod = await import("@/app/(authenticated)/page");

    await expect(mod.default()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
