import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the module
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

vi.mock("@parse/node-apn", () => ({
  default: {
    Provider: vi.fn(),
    Notification: vi.fn().mockImplementation(() => ({
      alert: {},
      sound: "",
      topic: "",
      payload: {},
    })),
  },
}));

vi.mock("@listwell/db", () => ({
  db: {
    query: {
      pushSubscriptions: {
        findMany: vi.fn(),
      },
    },
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
}));

import { db } from "@listwell/db";
import webpush from "web-push";
import { sendPushNotification, sendListingReadyNotification } from "./notifications";

describe("sendPushNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return early when no subscriptions exist", async () => {
    vi.mocked(db.query.pushSubscriptions.findMany).mockResolvedValue([]);

    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it("should send web push notifications to web subscribers", async () => {
    vi.mocked(db.query.pushSubscriptions.findMany).mockResolvedValue([
      {
        id: "sub-1",
        userId: "user-1",
        type: "web",
        endpoint: "https://push.example.com/sub1",
        p256dh: "key1",
        auth: "auth1",
        deviceToken: null,
        createdAt: new Date(),
      },
    ]);

    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never);

    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: "https://push.example.com/sub1",
        keys: { p256dh: "key1", auth: "auth1" },
      },
      expect.any(String),
    );
  });

  it("should skip APNs subscriptions when no provider configured", async () => {
    vi.mocked(db.query.pushSubscriptions.findMany).mockResolvedValue([
      {
        id: "sub-2",
        userId: "user-1",
        type: "apns",
        endpoint: null,
        p256dh: null,
        auth: null,
        deviceToken: "abc123",
        createdAt: new Date(),
      },
    ]);

    // No APNs provider configured, should not throw
    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    // Web push should not be called for APNs subscriptions
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it("should handle mixed web and APNs subscriptions", async () => {
    vi.mocked(db.query.pushSubscriptions.findMany).mockResolvedValue([
      {
        id: "sub-1",
        userId: "user-1",
        type: "web",
        endpoint: "https://push.example.com/sub1",
        p256dh: "key1",
        auth: "auth1",
        deviceToken: null,
        createdAt: new Date(),
      },
      {
        id: "sub-2",
        userId: "user-1",
        type: "apns",
        endpoint: null,
        p256dh: null,
        auth: null,
        deviceToken: "abc123",
        createdAt: new Date(),
      },
    ]);

    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never);

    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    // Only web push should be called (APNs provider not configured)
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
  });
});

describe("sendListingReadyNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send notification with listing title", async () => {
    vi.mocked(db.query.pushSubscriptions.findMany).mockResolvedValue([
      {
        id: "sub-1",
        userId: "user-1",
        type: "web",
        endpoint: "https://push.example.com/sub1",
        p256dh: "key1",
        auth: "auth1",
        deviceToken: null,
        createdAt: new Date(),
      },
    ]);

    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never);

    await sendListingReadyNotification("user-1", "listing-123", "Vintage Chair");

    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    const payloadStr = vi.mocked(webpush.sendNotification).mock.calls[0][1] as string;
    const payload = JSON.parse(payloadStr);
    expect(payload.title).toBe("Listing Ready!");
    expect(payload.body).toBe("Vintage Chair");
    expect(payload.data.listingId).toBe("listing-123");
    expect(payload.data.url).toBe("/listings/listing-123");
  });

  it("should use default body when title is empty", async () => {
    vi.mocked(db.query.pushSubscriptions.findMany).mockResolvedValue([
      {
        id: "sub-1",
        userId: "user-1",
        type: "web",
        endpoint: "https://push.example.com/sub1",
        p256dh: "key1",
        auth: "auth1",
        deviceToken: null,
        createdAt: new Date(),
      },
    ]);

    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never);

    await sendListingReadyNotification("user-1", "listing-123", "");

    const payloadStr = vi.mocked(webpush.sendNotification).mock.calls[0][1] as string;
    const payload = JSON.parse(payloadStr);
    expect(payload.body).toBe("Your listing has been generated");
  });
});
