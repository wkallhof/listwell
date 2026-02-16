// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {},
}));

describe("auth route handler", () => {
  it("exports GET and POST handlers", async () => {
    const route = await import("@/app/api/auth/[...all]/route");
    expect(route.GET).toBeDefined();
    expect(route.POST).toBeDefined();
  });

  it("GET handler is a function", async () => {
    const route = await import("@/app/api/auth/[...all]/route");
    expect(typeof route.GET).toBe("function");
    expect(typeof route.POST).toBe("function");
  });
});
