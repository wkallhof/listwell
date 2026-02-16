// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
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

const mockFindFirstListing = vi.fn();
const mockFindFirstImage = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      listings: {
        findFirst: (...args: unknown[]) => mockFindFirstListing(...args),
      },
      listingImages: {
        findFirst: (...args: unknown[]) => mockFindFirstImage(...args),
      },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  listings: { id: "id", userId: "user_id" },
  listingImages: { id: "id", listingId: "listing_id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (field: unknown, value: unknown) => ({ field, value }),
  and: (...args: unknown[]) => ({ and: args }),
}));

const mockSend = vi.fn();
vi.mock("@/inngest/client", () => ({
  inngest: {
    send: (...args: unknown[]) => mockSend(...args),
  },
}));

import { POST } from "@/app/api/listings/[id]/enhance/route";

const mockSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test" },
  session: { id: "session-1" },
};

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/listings/[id]/enhance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/listings/1/enhance", {
      method: "POST",
      body: JSON.stringify({ imageId: "img-1" }),
    });

    const response = await POST(request, createParams("1"));
    expect(response.status).toBe(401);
  });

  it("returns 404 when listing not found", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirstListing.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/listings/1/enhance", {
      method: "POST",
      body: JSON.stringify({ imageId: "img-1" }),
    });

    const response = await POST(request, createParams("nonexistent"));
    expect(response.status).toBe(404);
  });

  it("returns 400 when imageId is missing", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirstListing.mockResolvedValue({ id: "listing-1" });

    const request = new NextRequest("http://localhost:3000/api/listings/1/enhance", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request, createParams("listing-1"));
    expect(response.status).toBe(400);
  });

  it("returns 404 when image not found", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirstListing.mockResolvedValue({ id: "listing-1" });
    mockFindFirstImage.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/listings/1/enhance", {
      method: "POST",
      body: JSON.stringify({ imageId: "nonexistent" }),
    });

    const response = await POST(request, createParams("listing-1"));
    expect(response.status).toBe(404);
  });

  it("returns 400 when image is not ORIGINAL type", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirstListing.mockResolvedValue({ id: "listing-1" });
    mockFindFirstImage.mockResolvedValue({ id: "img-1", type: "ENHANCED" });

    const request = new NextRequest("http://localhost:3000/api/listings/1/enhance", {
      method: "POST",
      body: JSON.stringify({ imageId: "img-1" }),
    });

    const response = await POST(request, createParams("listing-1"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("original");
  });

  it("triggers Inngest event and returns processing status", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirstListing.mockResolvedValue({ id: "listing-1" });
    mockFindFirstImage.mockResolvedValue({ id: "img-1", type: "ORIGINAL" });
    mockSend.mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost:3000/api/listings/1/enhance", {
      method: "POST",
      body: JSON.stringify({ imageId: "img-1" }),
    });

    const response = await POST(request, createParams("listing-1"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("processing");

    expect(mockSend).toHaveBeenCalledWith({
      name: "image.enhance.requested",
      data: {
        imageId: "img-1",
        listingId: "listing-1",
      },
    });
  });
});
