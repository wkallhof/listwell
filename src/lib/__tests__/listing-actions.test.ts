// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockInngestSend = vi.fn();

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("@/db", () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

vi.mock("@/inngest/client", () => ({
  inngest: {
    send: (...args: unknown[]) => mockInngestSend(...args),
  },
}));

vi.mock("@/db/schema", () => ({
  listings: { id: "listings" },
  listingImages: { id: "listingImages" },
}));

beforeEach(() => {
  vi.clearAllMocks();

  mockInsert.mockReturnValue({ values: mockValues });
  mockValues.mockReturnValue({ returning: mockReturning });
});

describe("createListing", () => {
  it("returns error when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const { createListing } = await import("@/lib/listing-actions");

    const result = await createListing({
      images: [{ key: "k", url: "https://r2.test/img.jpg", filename: "photo.jpg" }],
    });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when no images provided", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const { createListing } = await import("@/lib/listing-actions");

    const result = await createListing({ images: [] });

    expect(result).toEqual({
      success: false,
      error: "At least one image is required",
    });
  });

  it("returns error when more than 5 images", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const { createListing } = await import("@/lib/listing-actions");

    const images = Array.from({ length: 6 }, (_, i) => ({
      key: `k${i}`,
      url: `https://r2.test/img${i}.jpg`,
      filename: `photo${i}.jpg`,
    }));

    const result = await createListing({ images });

    expect(result).toEqual({
      success: false,
      error: "Maximum 5 images allowed",
    });
  });

  it("creates listing and image records on success", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockReturning.mockResolvedValue([{ id: "listing-1" }]);
    mockInngestSend.mockResolvedValue(undefined);

    const { createListing } = await import("@/lib/listing-actions");

    const result = await createListing({
      description: "A nice camera",
      images: [
        { key: "listings/abc/photo.jpg", url: "https://r2.test/img.jpg", filename: "photo.jpg" },
      ],
    });

    expect(result).toEqual({ success: true, listingId: "listing-1" });
    // Check listing was inserted with correct values
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        rawDescription: "A nice camera",
        status: "DRAFT",
        pipelineStep: "PENDING",
      }),
    );
    // Check Inngest event was sent
    expect(mockInngestSend).toHaveBeenCalledWith({
      name: "listing.submitted",
      data: {
        listingId: "listing-1",
        imageUrls: ["https://r2.test/img.jpg"],
        userDescription: "A nice camera",
      },
    });
  });

  it("creates listing with null description when not provided", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockReturning.mockResolvedValue([{ id: "listing-2" }]);
    mockInngestSend.mockResolvedValue(undefined);

    const { createListing } = await import("@/lib/listing-actions");

    const result = await createListing({
      images: [
        { key: "listings/abc/photo.jpg", url: "https://r2.test/img.jpg", filename: "photo.jpg" },
      ],
    });

    expect(result).toEqual({ success: true, listingId: "listing-2" });
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        rawDescription: null,
      }),
    );
    // Inngest event should have null description
    expect(mockInngestSend).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "listing.submitted",
        data: expect.objectContaining({
          userDescription: null,
        }),
      }),
    );
  });
});
