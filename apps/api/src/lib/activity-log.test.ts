// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@listwell/db", () => ({
  db: {
    insert: vi.fn(),
  },
}));

vi.mock("@listwell/db/schema", () => ({
  userActivityLog: { tableName: "user_activity_log" },
}));

import { db } from "@listwell/db";
import { logActivity, ACTIVITY_EVENTS } from "./activity-log";

function mockInsert() {
  const chain = {
    values: vi.fn().mockResolvedValue(undefined),
  };
  vi.mocked(db.insert).mockReturnValue(chain as never);
  return chain;
}

describe("logActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should insert an activity log entry", async () => {
    const chain = mockInsert();

    await logActivity({
      userId: "user-1",
      eventType: ACTIVITY_EVENTS.LISTING_CREATED,
      description: "Created a new listing",
      resourceType: "listing",
      resourceId: "listing-1",
      metadata: { imageCount: 3 },
    });

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(chain.values).toHaveBeenCalledWith({
      userId: "user-1",
      eventType: "LISTING_CREATED",
      description: "Created a new listing",
      resourceType: "listing",
      resourceId: "listing-1",
      metadata: { imageCount: 3 },
    });
  });

  it("should pass only provided fields for minimal input", async () => {
    const chain = mockInsert();

    await logActivity({
      userId: "user-1",
      eventType: ACTIVITY_EVENTS.LOGIN,
    });

    expect(chain.values).toHaveBeenCalledWith({
      userId: "user-1",
      eventType: "LOGIN",
    });
  });

  it("should swallow errors and never throw", async () => {
    vi.mocked(db.insert).mockImplementation(() => {
      throw new Error("DB connection failed");
    });

    await expect(
      logActivity({
        userId: "user-1",
        eventType: ACTIVITY_EVENTS.ACCOUNT_CREATED,
      }),
    ).resolves.toBeUndefined();
  });
});

describe("ACTIVITY_EVENTS", () => {
  it("should export all expected event types", () => {
    expect(ACTIVITY_EVENTS.ACCOUNT_CREATED).toBe("ACCOUNT_CREATED");
    expect(ACTIVITY_EVENTS.LOGIN).toBe("LOGIN");
    expect(ACTIVITY_EVENTS.LISTING_CREATED).toBe("LISTING_CREATED");
    expect(ACTIVITY_EVENTS.PIPELINE_COMPLETE).toBe("PIPELINE_COMPLETE");
    expect(ACTIVITY_EVENTS.PIPELINE_ERROR).toBe("PIPELINE_ERROR");
    expect(ACTIVITY_EVENTS.CREDITS_PURCHASED).toBe("CREDITS_PURCHASED");
    expect(ACTIVITY_EVENTS.MANUAL_CREDIT_GRANT).toBe("MANUAL_CREDIT_GRANT");
    expect(ACTIVITY_EVENTS.MANUAL_CREDIT_DEDUCT).toBe("MANUAL_CREDIT_DEDUCT");
    expect(ACTIVITY_EVENTS.ACCOUNT_SUSPENDED).toBe("ACCOUNT_SUSPENDED");
    expect(ACTIVITY_EVENTS.IMAGE_ENHANCE_REQUESTED).toBe("IMAGE_ENHANCE_REQUESTED");
    expect(Object.keys(ACTIVITY_EVENTS)).toHaveLength(20);
  });
});
