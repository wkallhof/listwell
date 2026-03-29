// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@listwell/db", () => ({
  db: {
    query: {
      listings: { findFirst: vi.fn() },
    },
    update: vi.fn(),
  },
}));

vi.mock("@listwell/db/schema", () => ({
  listings: { id: "id", userId: "user_id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_field: unknown, value: unknown) => ({ field: _field, value })),
}));

vi.mock("../../lib/ai/agent", () => ({
  runListingAgent: vi.fn(),
}));

vi.mock("../../lib/notifications", () => ({
  sendListingReadyNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../lib/credits", () => ({
  refundCredit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../client", () => ({
  inngest: {
    createFunction: vi.fn((_config, _event, handler) => handler),
  },
}));

import { db } from "@listwell/db";
import { runListingAgent } from "../../lib/ai/agent";

// Build a minimal step mock that just runs the step functions
function createStepMock() {
  return {
    run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
  };
}

describe("generate-listing Inngest function", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: db.update returns chainable
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setMock });
  });

  it("stores cost data on the listing record after agent completes", async () => {
    const mockAgentResult = {
      output: {
        title: "Test Item",
        description: "A nice test item",
        suggestedPrice: 25,
        priceRangeLow: 20,
        priceRangeHigh: 30,
        category: "Electronics",
        condition: "Good",
        brand: "TestBrand",
        model: "X100",
        researchNotes: "Found similar items",
        comparables: [],
      },
      costUsd: 0.042,
      inputTokens: 5000,
      outputTokens: 1200,
      provider: "anthropic-api",
      transcriptUrl: "https://example.com/transcript.jsonl",
    };

    (runListingAgent as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAgentResult,
    );

    // Track db.update calls across steps
    const setCalls: Record<string, unknown>[] = [];
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockImplementation((data: Record<string, unknown>) => {
      setCalls.push(data);
      return { where: whereMock };
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setMock });

    // Mock findFirst for notification lookup
    (db.query.listings.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "listing-1",
      userId: "user-1",
    });

    // Import the handler (inngest.createFunction returns the handler via our mock)
    const { generateListing } = await import("./generate-listing");
    const handler = generateListing as unknown as (args: {
      event: { data: Record<string, unknown> };
      step: ReturnType<typeof createStepMock>;
    }) => Promise<unknown>;

    const step = createStepMock();
    await handler({
      event: {
        data: {
          listingId: "listing-1",
          imageUrls: ["https://example.com/photo.jpg"],
          userDescription: "A nice test item",
        },
      },
      step,
    });

    // The "complete" step is the second step.run call
    expect(step.run).toHaveBeenCalledTimes(2);

    // Find the "complete" step's db update (the last set call should contain cost data)
    const completeUpdate = setCalls.find(
      (call) => call.agentCostUsd !== undefined,
    );
    expect(completeUpdate).toBeDefined();
    expect(completeUpdate!.agentCostUsd).toBe(0.042);
    expect(completeUpdate!.agentInputTokens).toBe(5000);
    expect(completeUpdate!.agentOutputTokens).toBe(1200);
    expect(completeUpdate!.agentProvider).toBe("anthropic-api");
    expect(completeUpdate!.status).toBe("READY");
    expect(completeUpdate!.pipelineStep).toBe("COMPLETE");
  });

  it("stores zero cost data when provider returns zeros", async () => {
    const mockAgentResult = {
      output: {
        title: "Item",
        description: "Description",
        suggestedPrice: 10,
        priceRangeLow: 5,
        priceRangeHigh: 15,
        category: "Other",
        condition: "Good",
        brand: "Unknown",
        model: null,
        researchNotes: "",
        comparables: [],
      },
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      provider: "e2b",
      transcriptUrl: null,
    };

    (runListingAgent as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAgentResult,
    );

    const setCalls: Record<string, unknown>[] = [];
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockImplementation((data: Record<string, unknown>) => {
      setCalls.push(data);
      return { where: whereMock };
    });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: setMock });

    (db.query.listings.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "listing-2",
      userId: "user-2",
    });

    const { generateListing } = await import("./generate-listing");
    const handler = generateListing as unknown as (args: {
      event: { data: Record<string, unknown> };
      step: ReturnType<typeof createStepMock>;
    }) => Promise<unknown>;

    const step = createStepMock();
    await handler({
      event: {
        data: {
          listingId: "listing-2",
          imageUrls: ["https://example.com/photo.jpg"],
          userDescription: null,
        },
      },
      step,
    });

    const completeUpdate = setCalls.find(
      (call) => call.agentCostUsd !== undefined,
    );
    expect(completeUpdate).toBeDefined();
    expect(completeUpdate!.agentCostUsd).toBe(0);
    expect(completeUpdate!.agentInputTokens).toBe(0);
    expect(completeUpdate!.agentOutputTokens).toBe(0);
    expect(completeUpdate!.agentProvider).toBe("e2b");
  });
});
