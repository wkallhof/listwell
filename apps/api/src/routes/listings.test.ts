// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

vi.mock("@listwell/db", () => ({
  db: {
    query: {
      user: { findFirst: vi.fn() },
      userCredits: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@listwell/db/schema", () => ({
  user: { id: "id", suspended: "suspended" },
  listings: { id: "id", userId: "user_id" },
  listingImages: {},
  userCredits: { userId: "user_id", balance: "balance" },
  creditTransactions: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_field: unknown, value: unknown) => ({ field: _field, value })),
  desc: vi.fn((field: unknown) => ({ desc: true, field })),
  sql: vi.fn((...args: unknown[]) => ({ sql: true, args })),
}));

vi.mock("../inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("../lib/credits", () => ({
  getOrCreateUserCredits: vi.fn(),
  deductCredit: vi.fn(),
}));

import { db } from "@listwell/db";
import { listingsRoutes } from "./listings";

function createTestApp() {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("user", {
      id: "test-user-1",
      email: "test@example.com",
      name: "Test User",
      role: "user",
    });
    await next();
  });
  app.route("/", listingsRoutes);
  return app;
}

describe("POST /listings suspension check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 403 for suspended user", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({
      suspended: true,
    } as never);

    const app = createTestApp();
    const res = await app.request("/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: [{ key: "k", url: "http://example.com/img.jpg", filename: "img.jpg" }],
      }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("suspended");
  });

  it("should proceed normally for non-suspended user", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({
      suspended: false,
    } as never);

    const { getOrCreateUserCredits } = await import("../lib/credits");
    vi.mocked(getOrCreateUserCredits).mockResolvedValue({
      balance: 0,
      freeCreditsGranted: true,
    });

    const app = createTestApp();
    const res = await app.request("/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: [{ key: "k", url: "http://example.com/img.jpg", filename: "img.jpg" }],
      }),
    });

    // Should reach credit check (402 = insufficient credits, not 403)
    expect(res.status).toBe(402);
  });
});
