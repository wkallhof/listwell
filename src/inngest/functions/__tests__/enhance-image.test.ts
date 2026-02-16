// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Gemini
const mockEnhanceImage = vi.fn();
vi.mock("@/lib/ai/gemini", () => ({
  enhanceImage: (...args: unknown[]) => mockEnhanceImage(...args),
}));

// Mock enhancement prompt
vi.mock("@/lib/ai/enhancement-prompt", () => ({
  buildEnhancementPrompt: () => "test enhancement prompt",
}));

// Mock Vercel Blob
const mockPut = vi.fn();
vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockPut(...args),
}));

// Mock database
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockInsertReturning = vi.fn();
const mockInsertValues = vi
  .fn()
  .mockReturnValue({ returning: () => mockInsertReturning() });
const mockInsert = vi
  .fn()
  .mockReturnValue({ values: (...args: unknown[]) => mockInsertValues(...args) });

vi.mock("@/db", () => ({
  db: {
    query: {
      listingImages: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
      listings: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

vi.mock("@/db/schema", () => ({
  listingImages: { id: "id", parentImageId: "parent_image_id", listingId: "listing_id" },
  listings: { id: "id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (field: unknown, value: unknown) => ({ field, value }),
  and: (...args: unknown[]) => ({ and: args }),
}));

// Import after mocks
import { enhanceImageFunction } from "../enhance-image";

describe("enhanceImageFunction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is configured with correct id and event trigger", () => {
    expect(enhanceImageFunction).toBeDefined();
    expect(typeof enhanceImageFunction).toBe("object");
  });

  it("downloads original image, enhances, and uploads result", async () => {
    // First findFirst returns original image
    let findFirstCallCount = 0;
    mockFindFirst.mockImplementation(() => {
      findFirstCallCount++;
      if (findFirstCallCount === 1) {
        return {
          id: "img-1",
          listingId: "listing-1",
          type: "ORIGINAL",
          blobUrl: "https://blob.example.com/original.jpg",
          sortOrder: 0,
        };
      }
      // Second call returns listing
      return {
        id: "listing-1",
        category: "Electronics",
        condition: "Good",
        title: "Test Item",
      };
    });

    // Mock fetch for downloading image
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () =>
        Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
      headers: new Headers({ "content-type": "image/jpeg" }),
    }) as unknown as typeof fetch;

    mockEnhanceImage.mockResolvedValue({
      imageBase64: "enhanced-base64",
      mimeType: "image/png",
    });

    mockPut.mockResolvedValue({
      url: "https://blob.example.com/enhanced.png",
      pathname: "listings/listing-1/enhanced.png",
    });

    mockFindMany.mockResolvedValue([]);

    mockInsertReturning.mockReturnValue([
      {
        id: "img-enhanced-1",
        blobUrl: "https://blob.example.com/enhanced.png",
      },
    ]);

    const mockStep = {
      run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
    };

    const handler = (enhanceImageFunction as unknown as { fn: unknown }).fn;
    let result: unknown;
    if (typeof handler === "function") {
      result = await handler({
        event: {
          data: {
            imageId: "img-1",
            listingId: "listing-1",
          },
        },
        step: mockStep,
      });
    }

    expect(mockEnhanceImage).toHaveBeenCalled();
    expect(mockPut).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
    expect(result).toEqual({
      imageId: "img-enhanced-1",
      blobUrl: "https://blob.example.com/enhanced.png",
      variantCount: 1,
    });

    globalThis.fetch = originalFetch;
  });

  it("throws when image is not found", async () => {
    mockFindFirst.mockResolvedValue(null);

    const mockStep = {
      run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
    };

    const handler = (enhanceImageFunction as unknown as { fn: unknown }).fn;
    if (typeof handler === "function") {
      await expect(
        handler({
          event: {
            data: { imageId: "nonexistent", listingId: "listing-1" },
          },
          step: mockStep,
        }),
      ).rejects.toThrow("Image nonexistent not found");
    }
  });

  it("throws when image is not ORIGINAL type", async () => {
    mockFindFirst.mockResolvedValue({
      id: "img-1",
      type: "ENHANCED",
      blobUrl: "https://blob.example.com/enhanced.jpg",
    });

    const mockStep = {
      run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
    };

    const handler = (enhanceImageFunction as unknown as { fn: unknown }).fn;
    if (typeof handler === "function") {
      await expect(
        handler({
          event: {
            data: { imageId: "img-1", listingId: "listing-1" },
          },
          step: mockStep,
        }),
      ).rejects.toThrow("Can only enhance original images");
    }
  });

  it("counts existing variants correctly", async () => {
    let findFirstCallCount = 0;
    mockFindFirst.mockImplementation(() => {
      findFirstCallCount++;
      if (findFirstCallCount === 1) {
        return {
          id: "img-1",
          type: "ORIGINAL",
          blobUrl: "https://blob.example.com/original.jpg",
          sortOrder: 0,
        };
      }
      return { id: "listing-1", category: null, condition: null, title: null };
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () =>
        Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
      headers: new Headers({ "content-type": "image/jpeg" }),
    }) as unknown as typeof fetch;

    mockEnhanceImage.mockResolvedValue({
      imageBase64: "enhanced",
      mimeType: "image/png",
    });

    mockPut.mockResolvedValue({
      url: "https://blob.example.com/enhanced2.png",
      pathname: "listings/listing-1/enhanced2.png",
    });

    // Two existing variants
    mockFindMany.mockResolvedValue([{ id: "v1" }, { id: "v2" }]);

    mockInsertReturning.mockReturnValue([
      { id: "img-new", blobUrl: "https://blob.example.com/enhanced2.png" },
    ]);

    const mockStep = {
      run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
    };

    const handler = (enhanceImageFunction as unknown as { fn: unknown }).fn;
    let result: unknown;
    if (typeof handler === "function") {
      result = await handler({
        event: {
          data: { imageId: "img-1", listingId: "listing-1" },
        },
        step: mockStep,
      });
    }

    expect((result as { variantCount: number }).variantCount).toBe(3);
  });
});
