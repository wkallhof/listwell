// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the claude-agent-sdk
const mockQuery = vi.fn();
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

// Mock the database
const mockUpdate = vi.fn();
const mockSet = vi.fn().mockReturnValue({ where: vi.fn() });
mockUpdate.mockReturnValue({ set: mockSet });
vi.mock("@/db", () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock("@/db/schema", () => ({
  listings: { id: "id" },
}));

import { buildListingAgentPrompt } from "../prompts/listing-agent-prompt";
import { listingAgentOutputSchema } from "../agent-output-schema";
import type { RunAgentInput } from "../agent";

describe("listing agent prompt", () => {
  it("includes title construction rules", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Title Construction");
    expect(prompt).toContain("65 characters max");
    expect(prompt).toContain("Brand + Item Type + Key Spec + Condition");
  });

  it("includes description writing guidelines", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Description Writing");
    expect(prompt).toContain("First-person perspective");
    expect(prompt).toContain("80-150 words");
  });

  it("includes pricing strategy", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Pricing Strategy");
    expect(prompt).toContain("10-15%");
    expect(prompt).toContain("Negotiation Buffer");
  });

  it("includes condition assessment framework", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Condition Assessment");
    expect(prompt).toContain("Like New");
    expect(prompt).toContain("round condition down");
  });

  it("includes market research notes template", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Market Research Notes");
    expect(prompt).toContain("Relisting reminder");
    expect(prompt).toContain("7-10 days");
  });

  it("includes web research instructions", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Web Research Instructions");
    expect(prompt).toContain("eBay");
    expect(prompt).toContain("comparable");
  });

  it("includes content safety rules", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Must Never Generate");
    expect(prompt).toContain("Pressure tactics");
  });

  it("includes category-specific listing tactics", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Category-Specific Listing Tactics");
    expect(prompt).toContain("Furniture");
    expect(prompt).toContain("dimensions (H x W x D)");
    expect(prompt).toContain("Electronics");
    expect(prompt).toContain("model number");
    expect(prompt).toContain("Tools");
    expect(prompt).toContain("voltage/power");
    expect(prompt).toContain("Clothing & Accessories");
    expect(prompt).toContain("Kids & Baby Items");
  });

  it("includes seasonal timing awareness", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Seasonal");
    expect(prompt).toContain("college move-in");
    expect(prompt).toContain("spring cleaning");
  });

  it("includes cross-posting guidance", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Cross-post");
    expect(prompt).toContain("buy/sell groups");
  });

  it("includes pricing tactic recommendations (OBO, Firm, bundle)", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Pricing tactic");
    expect(prompt).toContain("OBO");
    expect(prompt).toContain("Firm");
    expect(prompt).toContain("bundle");
  });

  it("includes platform-specific optimization notes", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Platform tips");
    expect(prompt).toContain("Facebook Marketplace");
    expect(prompt).toContain("eBay");
    expect(prompt).toContain("Craigslist");
    expect(prompt).toContain("peak times");
    expect(prompt).toContain("shipping weight");
  });

  it("includes prominent relisting reminder instruction", () => {
    const prompt = buildListingAgentPrompt();
    expect(prompt).toContain("Relisting reminder");
    expect(prompt).toContain("ALWAYS include");
    expect(prompt).toContain("7-10 days");
    expect(prompt).toContain("delete the listing and repost");
    expect(prompt).toContain("swap the lead photo");
  });
});

describe("listing agent output schema", () => {
  const validOutput = {
    title: "DeWalt 20V MAX Cordless Drill – Like New",
    description:
      "I bought this drill about a year ago for a small home project and have barely used it since. It is a DeWalt 20V MAX cordless drill with two speed settings and an LED work light. Comes with the original charger and one 2.0Ah battery. No scratches or wear marks. Works perfectly every time I have used it. Retails for $129, asking $75. Pickup in Riverside area. Message me with any questions.",
    suggestedPrice: 75,
    priceRangeLow: 55,
    priceRangeHigh: 90,
    category: "Tools",
    condition: "Like New" as const,
    brand: "DeWalt",
    model: "DCD771C2",
    researchNotes:
      "Found 6 comparable sold listings on eBay ranging from $55-90. Market is healthy with moderate supply. Your drill includes a battery and charger which puts it on the higher end. Tip: post on weekday evenings for best visibility. If this doesn't sell within 7-10 days, delete the listing and repost it.",
    comparables: [
      {
        title: "DeWalt DCD771 20V Drill",
        price: 65,
        source: "eBay Sold",
        condition: "Good",
        soldDate: "2026-02-01",
      },
      {
        title: "DeWalt 20V Cordless Drill Kit",
        price: 85,
        source: "eBay Sold",
        condition: "Like New",
      },
    ],
  };

  it("validates a complete valid output", () => {
    const result = listingAgentOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it("requires all mandatory fields", () => {
    const incomplete = { title: "Test" };
    const result = listingAgentOutputSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("allows optional model field to be omitted", () => {
    const withoutModel = { ...validOutput };
    delete (withoutModel as Record<string, unknown>).model;
    const result = listingAgentOutputSchema.safeParse(withoutModel);
    expect(result.success).toBe(true);
  });

  it("validates condition enum values", () => {
    const withBadCondition = { ...validOutput, condition: "Excellent" };
    const result = listingAgentOutputSchema.safeParse(withBadCondition);
    expect(result.success).toBe(false);
  });

  it("validates comparable structure", () => {
    const withBadComparable = {
      ...validOutput,
      comparables: [{ price: 50 }],
    };
    const result = listingAgentOutputSchema.safeParse(withBadComparable);
    expect(result.success).toBe(false);
  });

  it("allows comparable with optional fields omitted", () => {
    const withMinimalComparable = {
      ...validOutput,
      comparables: [
        { title: "Test Item", price: 50, source: "eBay Sold" },
      ],
    };
    const result = listingAgentOutputSchema.safeParse(withMinimalComparable);
    expect(result.success).toBe(true);
  });

  it("validates price fields are numbers", () => {
    const withStringPrice = { ...validOutput, suggestedPrice: "75" };
    const result = listingAgentOutputSchema.safeParse(withStringPrice);
    expect(result.success).toBe(false);
  });
});

describe("runListingAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockReturnValue({ where: vi.fn() });
  });

  it("constructs correct prompt with image URLs and description", async () => {
    const validOutput = {
      title: "Test Item",
      description: "A test description for the item.",
      suggestedPrice: 50,
      priceRangeLow: 40,
      priceRangeHigh: 60,
      category: "Electronics",
      condition: "Good",
      brand: "TestBrand",
      researchNotes: "Test notes.",
      comparables: [],
    };

    // Make mockQuery return an async iterable
    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "result",
          subtype: "success",
          total_cost_usd: 0.05,
          is_error: false,
          structured_output: validOutput,
        };
      },
    });

    const { runListingAgent } = await import("../agent");

    const input: RunAgentInput = {
      listingId: "test-123",
      imageUrls: [
        "https://blob.example.com/img1.jpg",
        "https://blob.example.com/img2.jpg",
      ],
      userDescription: "My old drill, works great",
    };

    const result = await runListingAgent(input);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const callArgs = mockQuery.mock.calls[0][0];
    expect(callArgs.prompt).toContain("img1.jpg");
    expect(callArgs.prompt).toContain("img2.jpg");
    expect(callArgs.prompt).toContain("My old drill, works great");
    expect(callArgs.options.model).toBe("claude-sonnet-4-5-20250929");
    expect(callArgs.options.outputFormat).toBeDefined();
    expect(result.output.title).toBe("Test Item");
    expect(result.costUsd).toBe(0.05);
  });

  it("handles missing user description", async () => {
    const validOutput = {
      title: "Unknown Item",
      description: "A found item.",
      suggestedPrice: 30,
      priceRangeLow: 20,
      priceRangeHigh: 40,
      category: "Other",
      condition: "Good",
      brand: "Unknown",
      researchNotes: "Limited data.",
      comparables: [],
    };

    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "result",
          subtype: "success",
          total_cost_usd: 0.03,
          is_error: false,
          structured_output: validOutput,
        };
      },
    });

    const { runListingAgent } = await import("../agent");

    const input: RunAgentInput = {
      listingId: "test-456",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    };

    const result = await runListingAgent(input);

    const callArgs = mockQuery.mock.calls[0][0];
    expect(callArgs.prompt).toContain(
      "No description provided. Analyze the photos to identify the item.",
    );
    expect(result.output.title).toBe("Unknown Item");
  });

  it("throws on agent error result", async () => {
    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "result",
          subtype: "error_during_execution",
          total_cost_usd: 0.01,
          is_error: true,
          errors: ["API rate limit exceeded"],
        };
      },
    });

    const { runListingAgent } = await import("../agent");

    const input: RunAgentInput = {
      listingId: "test-789",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    };

    await expect(runListingAgent(input)).rejects.toThrow(
      "API rate limit exceeded",
    );
  });

  it("throws when no structured output is produced", async () => {
    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "result",
          subtype: "success",
          total_cost_usd: 0.02,
          is_error: false,
          structured_output: null,
        };
      },
    });

    const { runListingAgent } = await import("../agent");

    const input: RunAgentInput = {
      listingId: "test-000",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    };

    await expect(runListingAgent(input)).rejects.toThrow(
      "Agent completed without producing structured output",
    );
  });
});
