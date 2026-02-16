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

const mockFindMany = vi.fn();
const mockInsertReturning = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      listings: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    },
    insert: () => ({
      values: (vals: unknown) => ({
        returning: () => mockInsertReturning(vals),
      }),
    }),
  },
}));

vi.mock("@/lib/blob", () => ({
  uploadImage: vi.fn().mockResolvedValue({
    url: "https://blob.test/image.jpg",
    key: "listings/test/image.jpg",
  }),
}));

vi.mock("@/db/schema", () => ({
  listings: { userId: "user_id", createdAt: "created_at" },
  listingImages: {},
}));

const mockInngestSend = vi.fn().mockResolvedValue({ ids: [] });
vi.mock("@/inngest/client", () => ({
  inngest: {
    send: (...args: unknown[]) => mockInngestSend(...args),
  },
}));

import { GET, POST } from "@/app/api/listings/route";

const mockSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test" },
  session: { id: "session-1" },
};

describe("GET /api/listings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns user listings sorted by createdAt desc", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const mockListings = [
      { id: "1", title: "Item 1", images: [] },
      { id: "2", title: "Item 2", images: [] },
    ];
    mockFindMany.mockResolvedValue(mockListings);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockListings);
    expect(mockFindMany).toHaveBeenCalled();
  });
});

describe("POST /api/listings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const formData = new FormData();
    formData.append("images", new File(["data"], "photo.jpg"));

    const request = new NextRequest("http://localhost:3000/api/listings", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when no images provided", async () => {
    mockGetSession.mockResolvedValue(mockSession);

    const formData = new FormData();

    const request = new NextRequest("http://localhost:3000/api/listings", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("At least one image is required");
  });

  it("returns 400 when more than 5 images provided", async () => {
    mockGetSession.mockResolvedValue(mockSession);

    const formData = new FormData();
    for (let i = 0; i < 6; i++) {
      formData.append("images", new File(["data"], `photo${i}.jpg`));
    }

    const request = new NextRequest("http://localhost:3000/api/listings", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Maximum 5 images allowed");
  });

  it("creates listing with images on valid request", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockInsertReturning
      .mockResolvedValueOnce([
        { id: "listing-1", userId: "user-1", status: "DRAFT" },
      ])
      .mockResolvedValue([
        {
          id: "img-1",
          listingId: "listing-1",
          blobUrl: "https://blob.test/image.jpg",
        },
      ]);

    const formData = new FormData();
    formData.append("description", "Test item");
    formData.append("images", new File(["data"], "photo.jpg"));

    const request = new NextRequest("http://localhost:3000/api/listings", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockInngestSend).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "listing.submitted",
        data: expect.objectContaining({
          listingId: "listing-1",
        }),
      }),
    );
  });
});
