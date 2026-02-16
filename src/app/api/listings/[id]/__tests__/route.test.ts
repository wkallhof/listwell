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

const mockFindFirst = vi.fn();
const mockUpdateReturning = vi.fn();
const mockDeleteWhere = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      listings: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => mockUpdateReturning(),
        }),
      }),
    }),
    delete: () => ({
      where: (...args: unknown[]) => mockDeleteWhere(...args),
    }),
  },
}));

vi.mock("@/lib/blob", () => ({
  deleteImages: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/db/schema", () => ({
  listings: { id: "id", userId: "user_id" },
  listingImages: {},
}));

import { GET, PATCH, DELETE } from "@/app/api/listings/[id]/route";

const mockSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test" },
  session: { id: "session-1" },
};

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/listings/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/listings/abc");
    const response = await GET(request, createParams("abc"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when listing not found", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/listings/nonexistent",
    );
    const response = await GET(request, createParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Listing not found");
  });

  it("returns listing with images when found", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    const mockListing = {
      id: "abc",
      title: "Test Item",
      images: [{ id: "img-1", blobUrl: "https://blob.test/photo.jpg" }],
    };
    mockFindFirst.mockResolvedValue(mockListing);

    const request = new NextRequest("http://localhost:3000/api/listings/abc");
    const response = await GET(request, createParams("abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Test Item");
    expect(data.images).toHaveLength(1);
  });
});

describe("PATCH /api/listings/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/listings/abc", {
      method: "PATCH",
      body: JSON.stringify({ title: "New Title" }),
      headers: { "content-type": "application/json" },
    });
    const response = await PATCH(request, createParams("abc"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when listing not found", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/listings/abc", {
      method: "PATCH",
      body: JSON.stringify({ title: "New Title" }),
      headers: { "content-type": "application/json" },
    });
    const response = await PATCH(request, createParams("abc"));

    expect(response.status).toBe(404);
  });

  it("updates allowed fields", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue({ id: "abc", userId: "user-1" });
    mockUpdateReturning.mockResolvedValue([
      { id: "abc", title: "New Title", status: "LISTED" },
    ]);

    const request = new NextRequest("http://localhost:3000/api/listings/abc", {
      method: "PATCH",
      body: JSON.stringify({ title: "New Title", status: "LISTED" }),
      headers: { "content-type": "application/json" },
    });
    const response = await PATCH(request, createParams("abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("New Title");
  });

  it("returns 400 when no valid fields provided", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue({ id: "abc", userId: "user-1" });

    const request = new NextRequest("http://localhost:3000/api/listings/abc", {
      method: "PATCH",
      body: JSON.stringify({ invalidField: "value" }),
      headers: { "content-type": "application/json" },
    });
    const response = await PATCH(request, createParams("abc"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No valid fields to update");
  });
});

describe("DELETE /api/listings/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/listings/abc", {
      method: "DELETE",
    });
    const response = await DELETE(request, createParams("abc"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when listing not found", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/listings/abc", {
      method: "DELETE",
    });
    const response = await DELETE(request, createParams("abc"));

    expect(response.status).toBe(404);
  });

  it("deletes listing and associated images", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockFindFirst.mockResolvedValue({
      id: "abc",
      userId: "user-1",
      images: [
        { id: "img-1", blobUrl: "https://blob.test/photo1.jpg" },
        { id: "img-2", blobUrl: "https://blob.test/photo2.jpg" },
      ],
    });
    mockDeleteWhere.mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost:3000/api/listings/abc", {
      method: "DELETE",
    });
    const response = await DELETE(request, createParams("abc"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
