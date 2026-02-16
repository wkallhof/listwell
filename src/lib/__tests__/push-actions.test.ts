// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

const mockFindFirst = vi.fn();
const mockInsertValues = vi.fn();
const mockUpdateSet = vi.fn();
const mockDeleteWhere = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      pushSubscriptions: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: () => ({
      values: (...args: unknown[]) => mockInsertValues(...args),
    }),
    update: () => ({
      set: (...args: unknown[]) => {
        mockUpdateSet(...args);
        return {
          where: vi.fn(),
        };
      },
    }),
    delete: () => ({
      where: (...args: unknown[]) => mockDeleteWhere(...args),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  pushSubscriptions: {
    userId: "user_id",
    endpoint: "endpoint",
    id: "id",
  },
}));

import { subscribePush, unsubscribePush } from "@/lib/push-actions";

const mockSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test" },
  session: { id: "session-1" },
};

const mockInput = {
  endpoint: "https://push.example.com/1",
  p256dh: "p256dh-key",
  auth: "auth-key",
};

describe("subscribePush", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await subscribePush(mockInput);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("creates new subscription when none exists", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue(null);

    const result = await subscribePush(mockInput);

    expect(result).toEqual({ success: true });
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        endpoint: mockInput.endpoint,
        p256dh: mockInput.p256dh,
        auth: mockInput.auth,
      }),
    );
  });

  it("updates existing subscription when endpoint matches", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue({
      id: "existing-sub",
      endpoint: mockInput.endpoint,
    });

    const result = await subscribePush(mockInput);

    expect(result).toEqual({ success: true });
    expect(mockUpdateSet).toHaveBeenCalledWith({
      p256dh: mockInput.p256dh,
      auth: mockInput.auth,
    });
    expect(mockInsertValues).not.toHaveBeenCalled();
  });
});

describe("unsubscribePush", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await unsubscribePush("https://push.example.com/1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });

  it("deletes subscription by endpoint", async () => {
    mockGetSession.mockResolvedValue(mockSession);

    const result = await unsubscribePush("https://push.example.com/1");

    expect(result).toEqual({ success: true });
    expect(mockDeleteWhere).toHaveBeenCalled();
  });
});
