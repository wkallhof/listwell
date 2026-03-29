// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

function makeThenableChain(resolveValue: unknown = []) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "where", "orderBy", "limit", "offset", "leftJoin"];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => {
    return Promise.resolve(resolveValue).then(onFulfilled, onRejected);
  };
  return chain;
}

vi.mock("@listwell/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@listwell/db/schema", () => ({
  userActivityLog: {
    id: "id", userId: "userId", eventType: "eventType",
    description: "description", resourceType: "resourceType",
    resourceId: "resourceId", metadata: "metadata", createdAt: "createdAt",
  },
  user: { id: "id", name: "name", email: "email" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_f: unknown, v: unknown) => ({ eq: true, v })),
  and: vi.fn((...conds: unknown[]) => ({ and: true, conds })),
  desc: vi.fn((f: unknown) => ({ desc: true, f })),
  gte: vi.fn((_f: unknown, v: unknown) => ({ gte: true, v })),
  lte: vi.fn((_f: unknown, v: unknown) => ({ lte: true, v })),
  count: vi.fn(() => "count"),
}));

import { db } from "@listwell/db";
import { adminActivityRoutes } from "./activity";

function createTestApp() {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("user", {
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
    });
    await next();
  });
  app.route("/", adminActivityRoutes);
  return app;
}

describe("GET /admin/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated global activity feed", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeThenableChain([{ total: 2 }]) as never)
      .mockReturnValueOnce(makeThenableChain([
        {
          id: "act1", userId: "u1", eventType: "LOGIN",
          description: "User logged in", userName: "Alice",
          userEmail: "alice@example.com", createdAt: new Date("2026-01-01"),
        },
        {
          id: "act2", userId: "u2", eventType: "LISTING_CREATED",
          description: "Created listing", userName: "Bob",
          userEmail: "bob@example.com", createdAt: new Date("2026-01-02"),
        },
      ]) as never);

    const app = createTestApp();
    const res = await app.request("/admin/activity");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(2);
    expect(body.activities[0].userName).toBe("Alice");
    expect(body.pagination).toMatchObject({ page: 1, total: 2 });
  });

  it("should filter by eventType", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeThenableChain([{ total: 0 }]) as never)
      .mockReturnValueOnce(makeThenableChain([]) as never);

    const app = createTestApp();
    const res = await app.request("/admin/activity?eventType=LOGIN");
    expect(res.status).toBe(200);
    expect((await res.json()).activities).toHaveLength(0);
  });

  it("should filter by date range", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeThenableChain([{ total: 0 }]) as never)
      .mockReturnValueOnce(makeThenableChain([]) as never);

    const app = createTestApp();
    const res = await app.request("/admin/activity?dateFrom=2026-01-01&dateTo=2026-12-31");
    expect(res.status).toBe(200);
  });

  it("should paginate correctly", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeThenableChain([{ total: 50 }]) as never)
      .mockReturnValueOnce(makeThenableChain([]) as never);

    const app = createTestApp();
    const res = await app.request("/admin/activity?page=3&limit=10");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagination).toMatchObject({
      page: 3, limit: 10, total: 50, totalPages: 5,
    });
  });
});
