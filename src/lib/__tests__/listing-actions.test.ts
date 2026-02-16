// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockUploadImage = vi.fn();

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

vi.mock("@/db/schema", () => ({
  listings: { id: "listings" },
  listingImages: { id: "listingImages" },
}));

vi.mock("@/lib/blob", () => ({
  uploadImage: (...args: unknown[]) => mockUploadImage(...args),
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
    const formData = new FormData();
    formData.append(
      "images",
      new File(["x"], "photo.jpg", { type: "image/jpeg" }),
    );

    const result = await createListing(formData);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns error when no images provided", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const { createListing } = await import("@/lib/listing-actions");
    const formData = new FormData();

    const result = await createListing(formData);

    expect(result).toEqual({
      success: false,
      error: "At least one image is required",
    });
  });

  it("returns error when more than 5 images", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const { createListing } = await import("@/lib/listing-actions");
    const formData = new FormData();
    for (let i = 0; i < 6; i++) {
      formData.append(
        "images",
        new File(["x"], `photo${i}.jpg`, { type: "image/jpeg" }),
      );
    }

    const result = await createListing(formData);

    expect(result).toEqual({
      success: false,
      error: "Maximum 5 images allowed",
    });
  });

  it("creates listing and uploads images on success", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockReturning.mockResolvedValue([{ id: "listing-1" }]);
    mockUploadImage.mockResolvedValue({
      url: "https://blob.test/img.jpg",
      key: "img-key",
    });

    const { createListing } = await import("@/lib/listing-actions");
    const formData = new FormData();
    formData.append("description", "A nice camera");
    formData.append(
      "images",
      new File(["x"], "photo.jpg", { type: "image/jpeg" }),
    );

    const result = await createListing(formData);

    expect(result).toEqual({ success: true, listingId: "listing-1" });
    expect(mockUploadImage).toHaveBeenCalledTimes(1);
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
  });

  it("creates listing with null description when not provided", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockReturning.mockResolvedValue([{ id: "listing-2" }]);
    mockUploadImage.mockResolvedValue({
      url: "https://blob.test/img.jpg",
      key: "img-key",
    });

    const { createListing } = await import("@/lib/listing-actions");
    const formData = new FormData();
    formData.append(
      "images",
      new File(["x"], "photo.jpg", { type: "image/jpeg" }),
    );

    const result = await createListing(formData);

    expect(result).toEqual({ success: true, listingId: "listing-2" });
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        rawDescription: null,
      }),
    );
  });
});
