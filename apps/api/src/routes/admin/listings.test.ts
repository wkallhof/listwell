// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

vi.mock("@listwell/db", () => {
  const selectFn = vi.fn();
  const fromFn = vi.fn();
  const leftJoinFn = vi.fn();
  const whereFn = vi.fn();
  const orderByFn = vi.fn();
  const limitFn = vi.fn();
  const offsetFn = vi.fn();

  // Chain for main select query
  selectFn.mockReturnValue({ from: fromFn });
  fromFn.mockReturnValue({ leftJoin: leftJoinFn });
  leftJoinFn.mockReturnValue({
    where: whereFn,
    leftJoin: leftJoinFn,
  });
  whereFn.mockReturnValue({ orderBy: orderByFn });
  orderByFn.mockReturnValue({ limit: limitFn });
  limitFn.mockReturnValue({ offset: offsetFn });
  offsetFn.mockResolvedValue([]);

  return {
    db: {
      select: selectFn,
      query: {
        listings: { findFirst: vi.fn() },
        creditTransactions: { findFirst: vi.fn() },
      },
    },
    __mocks: {
      selectFn,
      fromFn,
      leftJoinFn,
      whereFn,
      orderByFn,
      limitFn,
      offsetFn,
    },
  };
});

vi.mock("@listwell/db/schema", () => ({
  listings: {
    id: "id",
    userId: "user_id",
    title: "title",
    status: "status",
    pipelineStep: "pipeline_step",
    agentCostUsd: "agent_cost_usd",
    createdAt: "created_at",
  },
  listingImages: {
    listingId: "listing_id",
    blobUrl: "blob_url",
    isPrimary: "is_primary",
  },
  user: {
    id: "id",
    name: "name",
    email: "email",
  },
  creditTransactions: {
    listingId: "listing_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_field: unknown, value: unknown) => ({ op: "eq", field: _field, value })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
  or: vi.fn((...args: unknown[]) => ({ op: "or", args })),
  desc: vi.fn((field: unknown) => ({ op: "desc", field })),
  ilike: vi.fn((_field: unknown, value: unknown) => ({ op: "ilike", field: _field, value })),
  sql: Object.assign(
    vi.fn((...args: unknown[]) => ({ sql: true, args })),
    {
      // Tagged template support
      raw: vi.fn((str: string) => ({ raw: str })),
    },
  ),
}));

import { db } from "@listwell/db";
import { adminListingsRoutes } from "./listings";

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
  app.route("/", adminListingsRoutes);
  return app;
}

describe("GET /admin/listings", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-chain the mock for each test
    const dbAny = db as unknown as {
      select: ReturnType<typeof vi.fn>;
    };
    const fromFn = vi.fn();
    const leftJoinFn = vi.fn();
    const whereFn = vi.fn();
    const orderByFn = vi.fn();
    const limitFn = vi.fn();
    const offsetFn = vi.fn();
    const selectCountFn = vi.fn();
    const fromCountFn = vi.fn();
    const leftJoinCountFn = vi.fn();
    const whereCountFn = vi.fn();

    // Count chain resolves to [{count: 0}]
    whereCountFn.mockResolvedValue([{ count: 0 }]);
    leftJoinCountFn.mockReturnValue({ where: whereCountFn, leftJoin: leftJoinCountFn });
    fromCountFn.mockReturnValue({ leftJoin: leftJoinCountFn });
    selectCountFn.mockReturnValue({ from: fromCountFn });

    // Main list chain resolves to []
    offsetFn.mockResolvedValue([]);
    limitFn.mockReturnValue({ offset: offsetFn });
    orderByFn.mockReturnValue({ limit: limitFn });
    whereFn.mockReturnValue({ orderBy: orderByFn });
    leftJoinFn.mockReturnValue({ where: whereFn, leftJoin: leftJoinFn });
    fromFn.mockReturnValue({ leftJoin: leftJoinFn });

    // First select call = main query, second = count
    let callCount = 0;
    dbAny.select.mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1) {
        return { from: fromFn };
      }
      return { from: fromCountFn };
    });
  });

  it("should return paginated listings with defaults", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/listings");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("pagination");
    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });

  it("should accept page and limit params", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/listings?page=2&limit=10");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.limit).toBe(10);
  });

  it("should cap limit at 100", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/listings?limit=500");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagination.limit).toBe(100);
  });

  it("should accept status filter", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/listings?status=READY");

    expect(res.status).toBe(200);
  });

  it("should accept pipelineStep filter", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/listings?pipelineStep=ERROR");

    expect(res.status).toBe(200);
  });

  it("should accept hasError filter", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/listings?hasError=true");

    expect(res.status).toBe(200);
  });

  it("should accept userId filter", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/listings?userId=user-123");

    expect(res.status).toBe(200);
  });

  it("should accept search param", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/listings?search=couch");

    expect(res.status).toBe(200);
  });

  it("should accept date range filters", async () => {
    const app = createTestApp();
    const res = await app.request(
      "/admin/listings?dateFrom=2026-01-01T00:00:00Z&dateTo=2026-12-31T23:59:59Z",
    );

    expect(res.status).toBe(200);
  });

  it("should accept sort params", async () => {
    const app = createTestApp();
    const res = await app.request("/admin/listings?sortBy=title&sortOrder=asc");

    expect(res.status).toBe(200);
  });

  it("should return listing items with user and thumbnail", async () => {
    const dbAny = db as unknown as {
      select: ReturnType<typeof vi.fn>;
    };

    const mockItems = [
      {
        id: "listing-1",
        title: "Vintage Couch",
        status: "READY",
        pipelineStep: "COMPLETE",
        agentCostUsd: 0.05,
        createdAt: new Date("2026-03-01"),
        userId: "user-1",
        userName: "Alice",
        userEmail: "alice@example.com",
      },
    ];

    const fromFn = vi.fn();
    const leftJoinFn = vi.fn();
    const whereFn = vi.fn();
    const orderByFn = vi.fn();
    const limitFn = vi.fn();
    const offsetFn = vi.fn();
    const selectCountFn = vi.fn();
    const fromCountFn = vi.fn();
    const leftJoinCountFn = vi.fn();
    const whereCountFn = vi.fn();

    // Image query chain
    const imgSelectFn = vi.fn();
    const imgFromFn = vi.fn();
    const imgWhereFn = vi.fn();
    imgWhereFn.mockResolvedValue([
      { listingId: "listing-1", blobUrl: "https://blob.example.com/thumb.jpg" },
    ]);
    imgFromFn.mockReturnValue({ where: imgWhereFn });
    imgSelectFn.mockReturnValue({ from: imgFromFn });

    whereCountFn.mockResolvedValue([{ count: 1 }]);
    leftJoinCountFn.mockReturnValue({ where: whereCountFn, leftJoin: leftJoinCountFn });
    fromCountFn.mockReturnValue({ leftJoin: leftJoinCountFn });
    selectCountFn.mockReturnValue({ from: fromCountFn });

    offsetFn.mockResolvedValue(mockItems);
    limitFn.mockReturnValue({ offset: offsetFn });
    orderByFn.mockReturnValue({ limit: limitFn });
    whereFn.mockReturnValue({ orderBy: orderByFn });
    leftJoinFn.mockReturnValue({ where: whereFn, leftJoin: leftJoinFn });
    fromFn.mockReturnValue({ leftJoin: leftJoinFn });

    let callCount = 0;
    dbAny.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return { from: fromFn };
      if (callCount === 2) return { from: fromCountFn };
      return { from: imgFromFn };
    });

    const app = createTestApp();
    const res = await app.request("/admin/listings");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: "listing-1",
      title: "Vintage Couch",
      status: "READY",
      thumbnailUrl: "https://blob.example.com/thumb.jpg",
      user: {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
      },
    });
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.totalPages).toBe(1);
  });
});

describe("GET /admin/listings/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 for non-existent listing", async () => {
    vi.mocked(db.query.listings.findFirst).mockResolvedValue(undefined);

    const app = createTestApp();
    const res = await app.request("/admin/listings/nonexistent");

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Listing not found");
  });

  it("should return full listing detail with admin fields", async () => {
    const mockListing = {
      id: "listing-1",
      userId: "user-1",
      title: "Vintage Couch",
      description: "A beautiful vintage couch in great condition",
      rawDescription: "old couch, good shape",
      suggestedPrice: 250,
      priceRangeLow: 200,
      priceRangeHigh: 350,
      category: "Furniture",
      condition: "Good",
      brand: null,
      model: null,
      researchNotes: "Comparable items sell for $200-$350",
      comparables: [{ title: "Similar Couch", price: 275, source: "eBay" }],
      status: "READY",
      pipelineStep: "COMPLETE",
      pipelineError: null,
      agentLog: [
        { ts: 1709300000, type: "status", content: "Analyzing images..." },
        { ts: 1709300010, type: "complete", content: "Done" },
      ],
      agentTranscriptUrl: "https://example.com/transcript",
      agentCostUsd: 0.05,
      agentInputTokens: 1200,
      agentOutputTokens: 800,
      agentProvider: "anthropic-api",
      inngestRunId: "run-123",
      createdAt: new Date("2026-03-01"),
      updatedAt: new Date("2026-03-01"),
      images: [
        {
          id: "img-1",
          listingId: "listing-1",
          type: "ORIGINAL",
          blobUrl: "https://blob.example.com/img.jpg",
          blobKey: "key-1",
          sortOrder: 0,
          isPrimary: true,
        },
      ],
      user: {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
      },
    };

    vi.mocked(db.query.listings.findFirst).mockResolvedValue(
      mockListing as never,
    );
    vi.mocked(db.query.creditTransactions.findFirst).mockResolvedValue({
      id: "txn-1",
      type: "USAGE",
      amount: -1,
      balanceAfter: 4,
      createdAt: new Date("2026-03-01"),
    } as never);

    const app = createTestApp();
    const res = await app.request("/admin/listings/listing-1");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("listing-1");
    expect(body.title).toBe("Vintage Couch");
    expect(body.agentCostUsd).toBe(0.05);
    expect(body.agentInputTokens).toBe(1200);
    expect(body.agentOutputTokens).toBe(800);
    expect(body.agentProvider).toBe("anthropic-api");
    expect(body.agentLog).toHaveLength(2);
    expect(body.agentTranscriptUrl).toBe("https://example.com/transcript");
    expect(body.user).toEqual({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
    });
    expect(body.creditTransaction).toMatchObject({
      id: "txn-1",
      type: "USAGE",
    });
  });

  it("should return null creditTransaction when none exists", async () => {
    vi.mocked(db.query.listings.findFirst).mockResolvedValue({
      id: "listing-2",
      title: "Test",
      images: [],
      user: { id: "u-1", name: "Bob", email: "bob@test.com" },
    } as never);
    vi.mocked(db.query.creditTransactions.findFirst).mockResolvedValue(
      undefined,
    );

    const app = createTestApp();
    const res = await app.request("/admin/listings/listing-2");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.creditTransaction).toBeNull();
  });
});
