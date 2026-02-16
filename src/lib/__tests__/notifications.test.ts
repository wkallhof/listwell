// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockSendNotification = vi.fn();
const mockSetVapidDetails = vi.fn();
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: (...args: unknown[]) => mockSetVapidDetails(...args),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  },
}));

const mockFindMany = vi.fn();
const mockDeleteWhere = vi.fn();
vi.mock("@/db", () => ({
  db: {
    query: {
      pushSubscriptions: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    },
    delete: () => ({
      where: (...args: unknown[]) => mockDeleteWhere(...args),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  pushSubscriptions: {
    userId: "user_id",
    id: "id",
  },
}));

import {
  sendPushNotification,
  sendListingReadyNotification,
} from "@/lib/notifications";

const mockSub = {
  id: "sub-1",
  endpoint: "https://push.example.com/1",
  p256dh: "key1",
  auth: "auth1",
};

const mockSub2 = {
  id: "sub-2",
  endpoint: "https://push.example.com/2",
  p256dh: "key2",
  auth: "auth2",
};

function parseSentPayload(callIndex = 0): Record<string, unknown> {
  return JSON.parse(mockSendNotification.mock.calls[callIndex]![1] as string);
}

describe("sendPushNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when user has no subscriptions", async () => {
    mockFindMany.mockResolvedValue([]);

    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it("sends notification to all user subscriptions", async () => {
    mockFindMany.mockResolvedValue([mockSub, mockSub2]);
    mockSendNotification.mockResolvedValue({});

    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    expect(mockSendNotification).toHaveBeenCalledTimes(2);
    expect(mockSendNotification).toHaveBeenCalledWith(
      { endpoint: mockSub.endpoint, keys: { p256dh: mockSub.p256dh, auth: mockSub.auth } },
      expect.any(String),
    );
  });

  it("serializes payload as JSON", async () => {
    mockFindMany.mockResolvedValue([mockSub]);
    mockSendNotification.mockResolvedValue({});

    const payload = { title: "Hello", body: "World", icon: "/icon.png" };
    await sendPushNotification("user-1", payload);

    expect(parseSentPayload()).toEqual(payload);
  });

  it("removes subscription on 410 Gone response", async () => {
    mockFindMany.mockResolvedValue([mockSub]);
    mockSendNotification.mockRejectedValue({ statusCode: 410 });

    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it("removes subscription on 404 Not Found response", async () => {
    mockFindMany.mockResolvedValue([mockSub]);
    mockSendNotification.mockRejectedValue({ statusCode: 404 });

    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it("does not remove subscription on other errors", async () => {
    mockFindMany.mockResolvedValue([mockSub]);
    mockSendNotification.mockRejectedValue({ statusCode: 500 });

    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });

  it("logs error when all notifications fail", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFindMany.mockResolvedValue([mockSub]);
    mockSendNotification.mockRejectedValue(new Error("Network error"));

    await sendPushNotification("user-1", {
      title: "Test",
      body: "Test body",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("All 1 notifications failed"),
    );
    consoleSpy.mockRestore();
  });
});

describe("sendListingReadyNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends notification with listing details", async () => {
    mockFindMany.mockResolvedValue([mockSub]);
    mockSendNotification.mockResolvedValue({});

    await sendListingReadyNotification("user-1", "listing-1", "Vintage Chair");

    const sentPayload = parseSentPayload();
    expect(sentPayload.title).toBe("Listing Ready!");
    expect(sentPayload.body).toBe("Vintage Chair");
    expect((sentPayload.data as Record<string, string>).url).toBe("/listings/listing-1");
  });

  it("uses fallback body when title is empty", async () => {
    mockFindMany.mockResolvedValue([mockSub]);
    mockSendNotification.mockResolvedValue({});

    await sendListingReadyNotification("user-1", "listing-1", "");

    expect(parseSentPayload().body).toBe("Your listing has been generated");
  });
});
