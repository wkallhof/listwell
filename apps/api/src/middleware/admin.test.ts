// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { requireAdmin } from "./admin";

function createTestApp(role: string) {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("user", {
      id: "test-user-1",
      email: "test@example.com",
      name: "Test User",
      role,
    });
    await next();
  });
  app.use("*", requireAdmin);
  app.get("/admin/test", (c) => c.json({ ok: true }));
  return app;
}

describe("requireAdmin middleware", () => {
  it("should return 403 for non-admin user", async () => {
    const app = createTestApp("user");
    const res = await app.request("/admin/test");

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("should pass through for admin user", async () => {
    const app = createTestApp("admin");
    const res = await app.request("/admin/test");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
