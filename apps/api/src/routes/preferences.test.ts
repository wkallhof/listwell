import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@listwell/db", () => ({
  db: {
    query: {
      userPreferences: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
  },
}));

vi.mock("@listwell/db/schema", () => ({
  userPreferences: {
    id: "id",
    userId: "user_id",
    themePreference: "theme_preference",
    notificationsEnabled: "notifications_enabled",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_field: unknown, value: unknown) => ({ field: _field, value })),
}));

import { Hono } from "hono";
import { preferencesRoutes } from "./preferences";
import { db } from "@listwell/db";

function createTestApp() {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("user", { id: "test-user-1", email: "test@example.com", name: "Test User" });
    await next();
  });
  app.route("/", preferencesRoutes);
  return app;
}

describe("GET /preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return defaults when no preferences exist", async () => {
    const app = createTestApp();
    vi.mocked(db.query.userPreferences.findFirst).mockResolvedValue(undefined);

    const res = await app.request("/preferences");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      themePreference: "system",
      notificationsEnabled: true,
    });
  });

  it("should return stored preferences", async () => {
    const app = createTestApp();
    vi.mocked(db.query.userPreferences.findFirst).mockResolvedValue({
      id: "pref-1",
      userId: "test-user-1",
      themePreference: "dark",
      notificationsEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await app.request("/preferences");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      themePreference: "dark",
      notificationsEnabled: false,
    });
  });
});

describe("PATCH /preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create preferences when none exist", async () => {
    const app = createTestApp();
    const findFirst = vi.mocked(db.query.userPreferences.findFirst);
    findFirst.mockResolvedValueOnce(undefined);
    findFirst.mockResolvedValueOnce({
      id: "pref-1",
      userId: "test-user-1",
      themePreference: "dark",
      notificationsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const insertValues = vi.fn();
    vi.mocked(db.insert).mockReturnValue({ values: insertValues } as never);

    const res = await app.request("/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: "dark" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.themePreference).toBe("dark");
    expect(db.insert).toHaveBeenCalled();
  });

  it("should update existing preferences", async () => {
    const app = createTestApp();
    const findFirst = vi.mocked(db.query.userPreferences.findFirst);
    findFirst.mockResolvedValueOnce({
      id: "pref-1",
      userId: "test-user-1",
      themePreference: "system",
      notificationsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    findFirst.mockResolvedValueOnce({
      id: "pref-1",
      userId: "test-user-1",
      themePreference: "light",
      notificationsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const setFn = vi.fn().mockReturnValue({ where: vi.fn() });
    vi.mocked(db.update).mockReturnValue({ set: setFn } as never);

    const res = await app.request("/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: "light" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.themePreference).toBe("light");
    expect(db.update).toHaveBeenCalled();
  });

  it("should reject invalid theme value", async () => {
    const app = createTestApp();

    const res = await app.request("/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: "midnight" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("themePreference");
  });

  it("should reject non-boolean notificationsEnabled", async () => {
    const app = createTestApp();

    const res = await app.request("/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationsEnabled: "yes" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("notificationsEnabled");
  });

  it("should reject empty body", async () => {
    const app = createTestApp();

    const res = await app.request("/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
