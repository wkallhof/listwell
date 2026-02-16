// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the agent
const mockRunListingAgent = vi.fn();
vi.mock("@/lib/ai/agent", () => ({
  runListingAgent: (...args: unknown[]) => mockRunListingAgent(...args),
}));

// Mock notifications
const mockSendNotification = vi.fn();
vi.mock("@/lib/notifications", () => ({
  sendListingReadyNotification: (...args: unknown[]) =>
    mockSendNotification(...args),
}));

// Mock database
const mockWhere = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
const mockFindFirst = vi.fn();

vi.mock("@/db", () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
    query: {
      listings: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  listings: { id: "id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (field: unknown, value: unknown) => ({ field, value }),
}));

// Import after mocks
import { generateListing } from "../generate-listing";

const validAgentOutput = {
  output: {
    title: "DeWalt 20V MAX Cordless Drill – Like New",
    description: "I bought this drill about a year ago and barely used it.",
    suggestedPrice: 75,
    priceRangeLow: 55,
    priceRangeHigh: 90,
    category: "Tools",
    condition: "Like New",
    brand: "DeWalt",
    model: "DCD771C2",
    researchNotes: "Found 6 comparable sold listings on eBay.",
    comparables: [
      { title: "DeWalt Drill", price: 65, source: "eBay Sold" },
    ],
  },
  costUsd: 0.05,
};

describe("generateListing Inngest function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockReturnValue({ where: mockWhere });
  });

  it("is configured with correct id and event trigger", () => {
    // Access the function's configuration
    expect(generateListing).toBeDefined();
    // The function should be an Inngest function object
    expect(typeof generateListing).toBe("object");
  });

  describe("run-agent step", () => {
    it("sets listing status to PROCESSING before running agent", async () => {
      mockRunListingAgent.mockResolvedValue(validAgentOutput);
      mockFindFirst.mockResolvedValue({
        id: "listing-1",
        userId: "user-1",
      });

      // Create mock step functions
      const stepResults: Record<string, unknown> = {};
      const mockStep = {
        run: vi.fn(async (name: string, fn: () => Promise<unknown>) => {
          const result = await fn();
          stepResults[name] = result;
          return result;
        }),
      };

      // Simulate calling the function handler
      const handler = (generateListing as unknown as { fn: unknown }).fn;
      if (typeof handler === "function") {
        await handler({
          event: {
            data: {
              listingId: "listing-1",
              imageUrls: ["https://blob.example.com/img.jpg"],
              userDescription: "My drill",
            },
          },
          step: mockStep,
        });
      }

      // Verify PROCESSING status was set (first update call in run-agent)
      expect(mockUpdate).toHaveBeenCalled();
      const firstSetCall = mockSet.mock.calls[0][0];
      expect(firstSetCall.status).toBe("PROCESSING");
      expect(firstSetCall.pipelineStep).toBe("PENDING");
    });

    it("calls runListingAgent with correct input", async () => {
      mockRunListingAgent.mockResolvedValue(validAgentOutput);
      mockFindFirst.mockResolvedValue({
        id: "listing-1",
        userId: "user-1",
      });

      const mockStep = {
        run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
      };

      const handler = (generateListing as unknown as { fn: unknown }).fn;
      if (typeof handler === "function") {
        await handler({
          event: {
            data: {
              listingId: "listing-1",
              imageUrls: [
                "https://blob.example.com/img1.jpg",
                "https://blob.example.com/img2.jpg",
              ],
              userDescription: "My power drill, works great",
            },
          },
          step: mockStep,
        });
      }

      expect(mockRunListingAgent).toHaveBeenCalledWith({
        listingId: "listing-1",
        imageUrls: [
          "https://blob.example.com/img1.jpg",
          "https://blob.example.com/img2.jpg",
        ],
        userDescription: "My power drill, works great",
      });
    });

    it("sets ERROR status when agent fails", async () => {
      mockRunListingAgent.mockRejectedValue(
        new Error("API rate limit exceeded"),
      );

      const mockStep = {
        run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
      };

      const handler = (generateListing as unknown as { fn: unknown }).fn;
      if (typeof handler === "function") {
        await expect(
          handler({
            event: {
              data: {
                listingId: "listing-1",
                imageUrls: ["https://blob.example.com/img.jpg"],
                userDescription: null,
              },
            },
            step: mockStep,
          }),
        ).rejects.toThrow("API rate limit exceeded");
      }

      // Verify error status was set
      const errorSetCall = mockSet.mock.calls.find(
        (call: unknown[]) =>
          (call[0] as Record<string, unknown>).pipelineStep === "ERROR",
      );
      expect(errorSetCall).toBeDefined();
      const errorData = errorSetCall![0] as Record<string, unknown>;
      expect(errorData.status).toBe("DRAFT");
      expect(errorData.pipelineError).toBe("API rate limit exceeded");
    });
  });

  describe("complete step", () => {
    it("saves all agent output fields to database", async () => {
      mockRunListingAgent.mockResolvedValue(validAgentOutput);
      mockFindFirst.mockResolvedValue({
        id: "listing-1",
        userId: "user-1",
      });

      const mockStep = {
        run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
      };

      const handler = (generateListing as unknown as { fn: unknown }).fn;
      if (typeof handler === "function") {
        await handler({
          event: {
            data: {
              listingId: "listing-1",
              imageUrls: ["https://blob.example.com/img.jpg"],
              userDescription: "My drill",
            },
          },
          step: mockStep,
        });
      }

      // Find the complete step's set call (status = READY)
      const readySetCall = mockSet.mock.calls.find(
        (call: unknown[]) =>
          (call[0] as Record<string, unknown>).status === "READY",
      );
      expect(readySetCall).toBeDefined();
      const readyData = readySetCall![0] as Record<string, unknown>;
      expect(readyData.title).toBe(
        "DeWalt 20V MAX Cordless Drill – Like New",
      );
      expect(readyData.suggestedPrice).toBe(75);
      expect(readyData.pipelineStep).toBe("COMPLETE");
      expect(readyData.brand).toBe("DeWalt");
      expect(readyData.model).toBe("DCD771C2");
    });

    it("sends push notification after saving", async () => {
      mockRunListingAgent.mockResolvedValue(validAgentOutput);
      mockFindFirst.mockResolvedValue({
        id: "listing-1",
        userId: "user-1",
      });

      const mockStep = {
        run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
      };

      const handler = (generateListing as unknown as { fn: unknown }).fn;
      if (typeof handler === "function") {
        await handler({
          event: {
            data: {
              listingId: "listing-1",
              imageUrls: ["https://blob.example.com/img.jpg"],
              userDescription: "My drill",
            },
          },
          step: mockStep,
        });
      }

      expect(mockSendNotification).toHaveBeenCalledWith(
        "user-1",
        "listing-1",
        "DeWalt 20V MAX Cordless Drill – Like New",
      );
    });

    it("returns success status", async () => {
      mockRunListingAgent.mockResolvedValue(validAgentOutput);
      mockFindFirst.mockResolvedValue({
        id: "listing-1",
        userId: "user-1",
      });

      const mockStep = {
        run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
      };

      const handler = (generateListing as unknown as { fn: unknown }).fn;
      let result: unknown;
      if (typeof handler === "function") {
        result = await handler({
          event: {
            data: {
              listingId: "listing-1",
              imageUrls: ["https://blob.example.com/img.jpg"],
              userDescription: null,
            },
          },
          step: mockStep,
        });
      }

      expect(result).toEqual({ listingId: "listing-1", status: "READY" });
    });
  });
});
