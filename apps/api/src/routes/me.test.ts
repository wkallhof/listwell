import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { meRoutes } from "./me";

function createTestApp() {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("user", { id: "test-user-1", email: "test@example.com", name: "Test User" });
    await next();
  });
  app.route("/", meRoutes);
  return app;
}

describe("GET /me", () => {
  it("should return user data from session", async () => {
    const app = createTestApp();

    const res = await app.request("/me");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: "test-user-1",
      name: "Test User",
      email: "test@example.com",
    });
  });
});
