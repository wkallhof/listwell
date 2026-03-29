// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Build a "thenable" chain: every method returns the chain itself,
// and the chain is also a thenable (has .then) so `await chain.xyz()` works.
function makeThenableChain(resolveValue: unknown = []) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "where", "orderBy", "limit", "offset",
    "leftJoin", "groupBy", "returning", "set", "values",
  ];

  let _resolve = resolveValue;

  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }

  // Make the chain await-able
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => {
    return Promise.resolve(_resolve).then(onFulfilled, onRejected);
  };

  // Allow tests to set the next resolved value
  chain._setResolve = (v: unknown) => { _resolve = v; };

  return chain as Record<string, ReturnType<typeof vi.fn>> & {
    then: (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => Promise<unknown>;
    _setResolve: (v: unknown) => void;
  };
}

vi.mock("@listwell/db", () => {
  return {
    db: {
      query: {
        user: { findFirst: vi.fn() },
        userCredits: { findFirst: vi.fn() },
        creditTransactions: { findFirst: vi.fn() },
      },
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    },
  };
});

vi.mock("@listwell/db/schema", () => ({
  user: {
    id: "id", name: "name", email: "email", role: "role",
    suspended: "suspended", suspendedReason: "suspendedReason",
    createdAt: "createdAt", updatedAt: "updatedAt",
  },
  userCredits: { userId: "userId", balance: "balance" },
  creditTransactions: {
    id: "id", userId: "userId", type: "type", amount: "amount",
    balanceAfter: "balanceAfter", listingId: "listingId",
    appleTransactionId: "appleTransactionId", adminUserId: "adminUserId",
    reason: "reason", note: "note", createdAt: "createdAt",
  },
  listings: { id: "id", userId: "userId", status: "status", pipelineStep: "pipelineStep" },
  userActivityLog: {
    id: "id", userId: "userId", eventType: "eventType",
    description: "description", resourceType: "resourceType",
    resourceId: "resourceId", metadata: "metadata", createdAt: "createdAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_f: unknown, v: unknown) => ({ eq: true, v })),
  sql: Object.assign(vi.fn((...a: unknown[]) => ({ sql: true, a })), {
    raw: vi.fn((s: string) => s),
  }),
  desc: vi.fn((f: unknown) => ({ desc: true, f })),
  asc: vi.fn((f: unknown) => ({ asc: true, f })),
  and: vi.fn((...conds: unknown[]) => ({ and: true, conds })),
  or: vi.fn((...conds: unknown[]) => ({ or: true, conds })),
  ilike: vi.fn((_f: unknown, v: unknown) => ({ ilike: true, v })),
  gte: vi.fn((_f: unknown, v: unknown) => ({ gte: true, v })),
  lte: vi.fn((_f: unknown, v: unknown) => ({ lte: true, v })),
  count: vi.fn(() => "count"),
}));

vi.mock("../../lib/credits", () => ({
  getOrCreateUserCredits: vi.fn(),
}));

vi.mock("../../lib/activity-log", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
  ACTIVITY_EVENTS: {
    MANUAL_CREDIT_GRANT: "MANUAL_CREDIT_GRANT",
    MANUAL_CREDIT_DEDUCT: "MANUAL_CREDIT_DEDUCT",
    ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
    ACCOUNT_UNSUSPENDED: "ACCOUNT_UNSUSPENDED",
  },
}));

import { db } from "@listwell/db";
import { adminUsersRoutes } from "./users";
import { getOrCreateUserCredits } from "../../lib/credits";
import { logActivity } from "../../lib/activity-log";

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
  app.route("/", adminUsersRoutes);
  return app;
}

describe("GET /admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated users with credit balance and listing count", async () => {
    // 1st select: count query
    const countChain = makeThenableChain([{ total: 1 }]);
    // 2nd select: users with left join credits
    const usersChain = makeThenableChain([
      {
        id: "u1", name: "Alice", email: "alice@example.com",
        role: "user", suspended: false,
        createdAt: new Date("2026-01-01"), creditBalance: 5,
      },
    ]);
    // 3rd select: listing counts
    const listingCountChain = makeThenableChain([{ userId: "u1", count: 3 }]);

    vi.mocked(db.select)
      .mockReturnValueOnce(countChain as never)
      .mockReturnValueOnce(usersChain as never)
      .mockReturnValueOnce(listingCountChain as never);

    const app = createTestApp();
    const res = await app.request("/admin/users");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.users).toHaveLength(1);
    expect(body.users[0]).toMatchObject({
      id: "u1", name: "Alice", creditBalance: 5, totalListings: 3,
    });
    expect(body.pagination).toMatchObject({ page: 1, total: 1 });
  });

  it("should apply search filter", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeThenableChain([{ total: 0 }]) as never)
      .mockReturnValueOnce(makeThenableChain([]) as never);

    const app = createTestApp();
    const res = await app.request("/admin/users?search=alice");
    expect(res.status).toBe(200);
  });

  it("should apply sort parameters", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeThenableChain([{ total: 0 }]) as never)
      .mockReturnValueOnce(makeThenableChain([]) as never);

    const app = createTestApp();
    const res = await app.request("/admin/users?sortBy=name&sortOrder=asc");
    expect(res.status).toBe(200);
  });
});

describe("GET /admin/users/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent user", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue(undefined);

    const app = createTestApp();
    const res = await app.request("/admin/users/missing-id");
    expect(res.status).toBe(404);
  });

  it("should return user detail with credits, listings, and activity", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({
      id: "u1", name: "Alice", email: "alice@example.com",
      role: "user", suspended: false, suspendedReason: null,
      createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
    } as never);

    vi.mocked(getOrCreateUserCredits).mockResolvedValue({
      balance: 5, freeCreditsGranted: true,
    });

    // listing summary, recent transactions, recent activity
    vi.mocked(db.select)
      .mockReturnValueOnce(makeThenableChain([{ total: 10, ready: 7, processing: 1, errored: 2 }]) as never)
      .mockReturnValueOnce(makeThenableChain([]) as never)
      .mockReturnValueOnce(makeThenableChain([]) as never);

    const app = createTestApp();
    const res = await app.request("/admin/users/u1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.id).toBe("u1");
    expect(body.credits.balance).toBe(5);
  });
});

describe("POST /admin/users/:id/credits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if reason is missing", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/users/u1/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant", amount: 5, reason: "" }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Reason");
  });

  it("should return 400 if amount is not positive integer", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/users/u1/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant", amount: -1, reason: "test" }),
    });
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid action", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/users/u1/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invalid", amount: 5, reason: "test" }),
    });
    expect(res.status).toBe(400);
  });

  it("should return 404 for non-existent user", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue(undefined);

    const app = createTestApp();
    const res = await app.request("/admin/users/missing/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant", amount: 5, reason: "test" }),
    });
    expect(res.status).toBe(404);
  });

  it("should grant credits and log activity", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(getOrCreateUserCredits).mockResolvedValue({ balance: 3, freeCreditsGranted: true });

    const updateChain = makeThenableChain([{ balance: 8 }]);
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const insertChain = makeThenableChain(undefined);
    vi.mocked(db.insert).mockReturnValue(insertChain as never);

    const app = createTestApp();
    const res = await app.request("/admin/users/u1/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant", amount: 5, reason: "Support escalation" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).balance).toBe(8);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "MANUAL_CREDIT_GRANT" }),
    );
  });

  it("should return 400 for deduct with insufficient balance", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(getOrCreateUserCredits).mockResolvedValue({ balance: 2, freeCreditsGranted: true });
    vi.mocked(db.query.userCredits.findFirst).mockResolvedValue({ balance: 2 } as never);

    const app = createTestApp();
    const res = await app.request("/admin/users/u1/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deduct", amount: 5, reason: "Abuse" }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Insufficient");
  });

  it("should deduct credits and log activity", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(getOrCreateUserCredits).mockResolvedValue({ balance: 10, freeCreditsGranted: true });
    vi.mocked(db.query.userCredits.findFirst).mockResolvedValue({ balance: 10 } as never);

    const updateChain = makeThenableChain([{ balance: 5 }]);
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const insertChain = makeThenableChain(undefined);
    vi.mocked(db.insert).mockReturnValue(insertChain as never);

    const app = createTestApp();
    const res = await app.request("/admin/users/u1/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deduct", amount: 5, reason: "Abuse" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).balance).toBe(5);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "MANUAL_CREDIT_DEDUCT" }),
    );
  });
});

describe("POST /admin/users/:id/suspend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if reason is missing", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/users/u1/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "suspend", reason: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid action", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/users/u1/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ban", reason: "test" }),
    });
    expect(res.status).toBe(400);
  });

  it("should return 404 for non-existent user", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue(undefined);

    const app = createTestApp();
    const res = await app.request("/admin/users/u1/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "suspend", reason: "Spam" }),
    });
    expect(res.status).toBe(404);
  });

  it("should suspend user and log activity", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({ id: "u1" } as never);

    const updateChain = makeThenableChain(undefined);
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const app = createTestApp();
    const res = await app.request("/admin/users/u1/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "suspend", reason: "Spam reports" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).suspended).toBe(true);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "ACCOUNT_SUSPENDED" }),
    );
  });

  it("should unsuspend user and log activity", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({ id: "u1" } as never);

    const updateChain = makeThenableChain(undefined);
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const app = createTestApp();
    const res = await app.request("/admin/users/u1/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unsuspend", reason: "Appeal approved" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).suspended).toBe(false);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "ACCOUNT_UNSUSPENDED" }),
    );
  });
});

describe("GET /admin/users/:id/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent user", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue(undefined);

    const app = createTestApp();
    const res = await app.request("/admin/users/missing/activity");
    expect(res.status).toBe(404);
  });

  it("should return paginated activity for user", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({ id: "u1" } as never);

    const countChain = makeThenableChain([{ total: 1 }]);
    const activitiesChain = makeThenableChain([
      {
        id: "act1", userId: "u1", eventType: "LOGIN",
        description: "User logged in", createdAt: new Date("2026-01-01"),
      },
    ]);

    vi.mocked(db.select)
      .mockReturnValueOnce(countChain as never)
      .mockReturnValueOnce(activitiesChain as never);

    const app = createTestApp();
    const res = await app.request("/admin/users/u1/activity");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activities).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("should filter by eventType and date range", async () => {
    vi.mocked(db.query.user.findFirst).mockResolvedValue({ id: "u1" } as never);

    vi.mocked(db.select)
      .mockReturnValueOnce(makeThenableChain([{ total: 0 }]) as never)
      .mockReturnValueOnce(makeThenableChain([]) as never);

    const app = createTestApp();
    const res = await app.request(
      "/admin/users/u1/activity?eventType=LOGIN&dateFrom=2026-01-01&dateTo=2026-12-31",
    );
    expect(res.status).toBe(200);
  });
});
