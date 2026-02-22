import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock drizzle-orm and db before importing the module under test
vi.mock("@listwell/db", () => ({
  db: {
    query: {
      pushSubscriptions: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
    delete: vi.fn().mockReturnValue({ where: vi.fn() }),
  },
}));

vi.mock("@listwell/db/schema", () => ({
  pushSubscriptions: {
    id: "id",
    userId: "user_id",
    type: "type",
    endpoint: "endpoint",
    p256dh: "p256dh",
    auth: "auth",
    deviceToken: "device_token",
    createdAt: "created_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_field: unknown, value: unknown) => ({ field: _field, value })),
  and: vi.fn((...conditions: unknown[]) => ({ conditions })),
}));

import { Hono } from "hono";
import { pushRoutes } from "./push";
import { db } from "@listwell/db";

// Create test app
function createTestApp() {
  const app = new Hono();
  // Mock auth middleware
  app.use("*", async (c, next) => {
    c.set("user", { id: "test-user-1", email: "test@example.com", name: "Test User" });
    await next();
  });
  app.route("/", pushRoutes);
  return app;
}

describe("POST /push/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create web push subscription", async () => {
    const app = createTestApp();
    const findFirst = vi.mocked(db.query.pushSubscriptions.findFirst);
    findFirst.mockResolvedValue(undefined);

    const insertValues = vi.fn();
    vi.mocked(db.insert).mockReturnValue({ values: insertValues } as never);

    const res = await app.request("/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://push.example.com/sub1",
        p256dh: "key123",
        auth: "auth123",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "test-user-1",
        type: "web",
        endpoint: "https://push.example.com/sub1",
        p256dh: "key123",
        auth: "auth123",
      }),
    );
  });

  it("should update existing web push subscription", async () => {
    const app = createTestApp();
    const findFirst = vi.mocked(db.query.pushSubscriptions.findFirst);
    findFirst.mockResolvedValue({
      id: "existing-sub-1",
      userId: "test-user-1",
      type: "web",
      endpoint: "https://push.example.com/sub1",
      p256dh: "oldkey",
      auth: "oldauth",
      deviceToken: null,
      createdAt: new Date(),
    });

    const setFn = vi.fn().mockReturnValue({ where: vi.fn() });
    vi.mocked(db.update).mockReturnValue({ set: setFn } as never);

    const res = await app.request("/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://push.example.com/sub1",
        p256dh: "newkey",
        auth: "newauth",
      }),
    });

    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
    expect(setFn).toHaveBeenCalledWith({ p256dh: "newkey", auth: "newauth" });
  });

  it("should reject web push with missing fields", async () => {
    const app = createTestApp();

    const res = await app.request("/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: "https://push.example.com/sub1" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("should create APNs subscription", async () => {
    const app = createTestApp();
    const findFirst = vi.mocked(db.query.pushSubscriptions.findFirst);
    findFirst.mockResolvedValue(undefined);

    const insertValues = vi.fn();
    vi.mocked(db.insert).mockReturnValue({ values: insertValues } as never);

    const res = await app.request("/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "apns",
        deviceToken: "abc123def456",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "test-user-1",
        type: "apns",
        deviceToken: "abc123def456",
      }),
    );
  });

  it("should not duplicate APNs subscription", async () => {
    const app = createTestApp();
    const findFirst = vi.mocked(db.query.pushSubscriptions.findFirst);
    findFirst.mockResolvedValue({
      id: "existing-apns-1",
      userId: "test-user-1",
      type: "apns",
      endpoint: null,
      p256dh: null,
      auth: null,
      deviceToken: "abc123def456",
      createdAt: new Date(),
    });

    const res = await app.request("/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "apns",
        deviceToken: "abc123def456",
      }),
    });

    expect(res.status).toBe(200);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should reject APNs with missing deviceToken", async () => {
    const app = createTestApp();

    const res = await app.request("/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "apns" }),
    });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /push/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete web push subscription by endpoint", async () => {
    const app = createTestApp();
    const deleteFn = vi.fn().mockReturnValue({ where: vi.fn() });
    vi.mocked(db.delete).mockReturnValue(deleteFn() as never);

    const res = await app.request("/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://push.example.com/sub1",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("should delete APNs subscription by deviceToken", async () => {
    const app = createTestApp();
    const deleteFn = vi.fn().mockReturnValue({ where: vi.fn() });
    vi.mocked(db.delete).mockReturnValue(deleteFn() as never);

    const res = await app.request("/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceToken: "abc123def456",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("should reject delete with no identifier", async () => {
    const app = createTestApp();

    const res = await app.request("/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
