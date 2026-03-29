// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Track all queries in order to return correct results
let queryIndex = 0;
let queryResults: unknown[][] = [];

function createQueryChain(idx: number) {
  const result = Promise.resolve(queryResults[idx] ?? []);
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    // Make the chain thenable so Promise.all can resolve it
    then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      result.then(resolve, reject),
    catch: (reject: (e: unknown) => void) => result.catch(reject),
  };
  // from() should return the same chain
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.groupBy.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  return chain;
}

vi.mock("@listwell/db", () => ({
  db: {
    select: vi.fn().mockImplementation(() => {
      const idx = queryIndex++;
      return createQueryChain(idx);
    }),
  },
}));

vi.mock("@listwell/db/schema", () => ({
  user: { id: "id", createdAt: "created_at" },
  listings: {
    id: "id",
    status: "status",
    agentCostUsd: "agent_cost_usd",
    createdAt: "created_at",
  },
  creditTransactions: {
    id: "id",
    type: "type",
    createdAt: "created_at",
  },
  userCredits: {
    balance: "balance",
  },
}));

vi.mock("drizzle-orm", () => {
  const sqlFn = (...args: unknown[]) => {
    const obj = { sql: true, args, as: (_name: string) => obj };
    return obj;
  };
  sqlFn.raw = (s: string) => ({ raw: s });
  return {
    sql: sqlFn,
    eq: vi.fn((_field: unknown, value: unknown) => ({ eq: true, value })),
    gte: vi.fn((_field: unknown, _value: unknown) => ({ gte: true })),
    and: vi.fn((...args: unknown[]) => ({ and: true, args })),
    count: vi.fn(() => ({ count: true })),
    sum: vi.fn((field: unknown) => ({ sum: true, field })),
    avg: vi.fn((field: unknown) => ({ avg: true, field })),
  };
});

import { adminDashboardRoutes } from "./dashboard";

function createTestApp() {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("user" as never, {
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
    });
    await next();
  });
  app.route("/", adminDashboardRoutes);
  return app;
}

describe("GET /admin/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryIndex = 0;
    // 7 parallel queries in order
    queryResults = [
      [{ count: 42 }],
      [{ count: 5 }],
      [{ count: 15 }],
      [
        { status: "READY", count: 20 },
        { status: "PROCESSING", count: 3 },
        { status: "DRAFT", count: 10 },
      ],
      [{ totalBalance: "100" }],
      [{ purchaseCount: 10 }],
      [{ totalCost: "1.50", avgCost: "0.075", processedCount: 20 }],
    ];
  });

  it("returns aggregated metrics", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/dashboard");

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.period).toBe("daily");
    expect(body.metrics.totalUsers).toBe(42);
    expect(body.metrics.newUsers7d).toBe(5);
    expect(body.metrics.newUsers30d).toBe(15);
    expect(body.metrics.totalListings).toBe(33);
    expect(body.metrics.listingsByStatus).toEqual({
      READY: 20,
      PROCESSING: 3,
      DRAFT: 10,
    });
  });

  it("calculates revenue correctly with Apple commission", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/dashboard");
    const body = await res.json();

    // 10 purchases × $4.99 = $49.90 gross
    expect(body.metrics.grossRevenue).toBeCloseTo(49.9, 1);
    // Apple 30% = $14.97
    expect(body.metrics.appleCommission).toBeCloseTo(14.97, 1);
    // Net = $34.93
    expect(body.metrics.netRevenue).toBeCloseTo(34.93, 1);
    expect(body.metrics.totalCosts).toBe(1.5);
    // Margin = net - costs = 34.93 - 1.5 = 33.43
    expect(body.metrics.margin).toBeCloseTo(33.43, 1);
  });

  it("accepts period query param", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/dashboard?period=monthly");
    const body = await res.json();
    expect(body.period).toBe("monthly");
  });
});

describe("GET /admin/revenue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryIndex = 0;
    queryResults = [
      [
        { date: "2026-03-01", purchases: 5 },
        { date: "2026-03-02", purchases: 3 },
      ],
    ];
  });

  it("returns revenue aggregation by period", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/revenue?period=daily");

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.period).toBe("daily");
    expect(body.data).toHaveLength(2);

    const first = body.data[0];
    expect(first.date).toBe("2026-03-01");
    expect(first.purchases).toBe(5);
    expect(first.grossRevenue).toBeCloseTo(24.95, 2);
    expect(first.netRevenue).toBeCloseTo(17.47, 2);
  });
});

describe("GET /admin/costs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryIndex = 0;
    queryResults = [
      [
        { date: "2026-03-01", totalCost: "0.50", listingCount: 8, avgCost: "0.0625" },
        { date: "2026-03-02", totalCost: "0.30", listingCount: 5, avgCost: "0.06" },
      ],
    ];
  });

  it("returns cost aggregation by period", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/costs?period=daily");

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.period).toBe("daily");
    expect(body.data).toHaveLength(2);

    const first = body.data[0];
    expect(first.date).toBe("2026-03-01");
    expect(first.totalCost).toBe(0.5);
    expect(first.listingCount).toBe(8);
    expect(first.avgCost).toBe(0.0625);
  });
});
