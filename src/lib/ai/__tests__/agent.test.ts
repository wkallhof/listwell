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

// Mock fs/promises
const mockMkdtemp = vi.fn();
const mockReadFile = vi.fn();
const mockRm = vi.fn();
vi.mock("node:fs/promises", () => ({
  mkdtemp: (...args: unknown[]) => mockMkdtemp(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  rm: (...args: unknown[]) => mockRm(...args),
}));

import { buildListingAgentPrompt } from "../prompts/listing-agent-prompt";
import { listingAgentOutputSchema } from "../agent-output-schema";
import { extractLogEntries } from "../agent";
import type { RunAgentInput } from "../agent";

describe("listing agent prompt", () => {
  it("includes title construction rules", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Title Construction");
    expect(prompt).toContain("65 characters max");
    expect(prompt).toContain("Brand + Item Type + Key Spec + Condition");
  });

  it("includes description writing guidelines", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Description Writing");
    expect(prompt).toContain("First-person perspective");
    expect(prompt).toContain("80-150 words");
  });

  it("includes pricing strategy", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Pricing Strategy");
    expect(prompt).toContain("10-15%");
    expect(prompt).toContain("Negotiation Buffer");
  });

  it("includes condition assessment framework", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Condition Assessment");
    expect(prompt).toContain("Like New");
    expect(prompt).toContain("round condition down");
  });

  it("includes market research notes template", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Market Research Notes");
    expect(prompt).toContain("Relisting reminder");
    expect(prompt).toContain("7-10 days");
  });

  it("includes web research instructions", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Web Research Instructions");
    expect(prompt).toContain("eBay");
    expect(prompt).toContain("comparable");
  });

  it("includes content safety rules", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Must Never Generate");
    expect(prompt).toContain("Pressure tactics");
  });

  it("includes category-specific listing tactics", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
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
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Seasonal");
    expect(prompt).toContain("college move-in");
    expect(prompt).toContain("spring cleaning");
  });

  it("includes cross-posting guidance", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Cross-post");
    expect(prompt).toContain("buy/sell groups");
  });

  it("includes pricing tactic recommendations (OBO, Firm, bundle)", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Pricing tactic");
    expect(prompt).toContain("OBO");
    expect(prompt).toContain("Firm");
    expect(prompt).toContain("bundle");
  });

  it("includes platform-specific optimization notes", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Platform tips");
    expect(prompt).toContain("Facebook Marketplace");
    expect(prompt).toContain("eBay");
    expect(prompt).toContain("Craigslist");
    expect(prompt).toContain("peak times");
    expect(prompt).toContain("shipping weight");
  });

  it("includes prominent relisting reminder instruction", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Relisting reminder");
    expect(prompt).toContain("ALWAYS include");
    expect(prompt).toContain("7-10 days");
    expect(prompt).toContain("delete the listing and repost");
    expect(prompt).toContain("swap the lead photo");
  });

  it("includes output format instructions for file-based output", () => {
    const prompt = buildListingAgentPrompt("/tmp/test");
    expect(prompt).toContain("Output Format");
    expect(prompt).toContain("listing-output.json");
    expect(prompt).toContain("Write tool");
    expect(prompt).toContain("CRITICAL");
  });

  it("includes the absolute output path in the prompt", () => {
    const prompt = buildListingAgentPrompt("/tmp/my-agent-dir");
    expect(prompt).toContain("/tmp/my-agent-dir/listing-output.json");
    expect(prompt).toContain("FULL ABSOLUTE path");
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

describe("extractLogEntries", () => {
  it("extracts text entries from assistant messages", () => {
    const message = {
      type: "assistant" as const,
      message: {
        content: [
          { type: "text", text: "Analyzing the item photos..." },
        ],
      },
    };

    const entries = extractLogEntries(message);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("text");
    expect(entries[0].content).toBe("Analyzing the item photos...");
  });

  it("truncates text entries to 200 chars", () => {
    const longText = "A".repeat(300);
    const message = {
      type: "assistant" as const,
      message: {
        content: [{ type: "text", text: longText }],
      },
    };

    const entries = extractLogEntries(message);

    expect(entries[0].content).toHaveLength(200);
  });

  it("extracts WebSearch tool_use entries", () => {
    const message = {
      type: "assistant" as const,
      message: {
        content: [
          {
            type: "tool_use",
            name: "WebSearch",
            input: { query: "DeWalt drill price eBay" },
          },
        ],
      },
    };

    const entries = extractLogEntries(message);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("search");
    expect(entries[0].content).toBe("Searching: DeWalt drill price eBay");
  });

  it("extracts WebFetch tool_use entries", () => {
    const message = {
      type: "assistant" as const,
      message: {
        content: [
          {
            type: "tool_use",
            name: "WebFetch",
            input: { url: "https://ebay.com/listing/123" },
          },
        ],
      },
    };

    const entries = extractLogEntries(message);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("fetch");
    expect(entries[0].content).toBe("Fetching: https://ebay.com/listing/123");
  });

  it("extracts Write tool_use entries", () => {
    const message = {
      type: "assistant" as const,
      message: {
        content: [
          {
            type: "tool_use",
            name: "Write",
            input: { file_path: "listing-output.json" },
          },
        ],
      },
    };

    const entries = extractLogEntries(message);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("write");
    expect(entries[0].content).toBe("Writing listing output");
  });

  it("handles multiple content blocks in one message", () => {
    const message = {
      type: "assistant" as const,
      message: {
        content: [
          { type: "text", text: "Let me search for prices" },
          {
            type: "tool_use",
            name: "WebSearch",
            input: { query: "drill prices" },
          },
        ],
      },
    };

    const entries = extractLogEntries(message);

    expect(entries).toHaveLength(2);
    expect(entries[0].type).toBe("text");
    expect(entries[1].type).toBe("search");
  });

  it("ignores unknown tool types", () => {
    const message = {
      type: "assistant" as const,
      message: {
        content: [
          {
            type: "tool_use",
            name: "UnknownTool",
            input: {},
          },
        ],
      },
    };

    const entries = extractLogEntries(message);

    expect(entries).toHaveLength(0);
  });

  it("handles empty content array", () => {
    const message = {
      type: "assistant" as const,
      message: {
        content: [],
      },
    };

    const entries = extractLogEntries(message);

    expect(entries).toHaveLength(0);
  });

  it("uses fallback for missing query in WebSearch", () => {
    const message = {
      type: "assistant" as const,
      message: {
        content: [
          {
            type: "tool_use",
            name: "WebSearch",
            input: {},
          },
        ],
      },
    };

    const entries = extractLogEntries(message);

    expect(entries[0].content).toBe("Searching: ...");
  });
});

describe("runListingAgent", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockReturnValue({ where: vi.fn() });
    mockMkdtemp.mockResolvedValue("/tmp/listwell-agent-abc123");
    mockRm.mockResolvedValue(undefined);
  });

  it("reads output from file after agent completes", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(validOutput));

    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "result",
          subtype: "success",
          total_cost_usd: 0.05,
          is_error: false,
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
    expect(callArgs.options.cwd).toBe("/tmp/listwell-agent-abc123");
    expect(callArgs.options.tools).toContain("Write");
    expect(result.output.title).toBe("Test Item");
    expect(result.costUsd).toBe(0.05);
  });

  it("handles missing user description", async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ ...validOutput, title: "Unknown Item" }),
    );

    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "result",
          subtype: "success",
          total_cost_usd: 0.03,
          is_error: false,
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

  it("throws when output file is missing", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT: no such file"));

    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "result",
          subtype: "success",
          total_cost_usd: 0.02,
          is_error: false,
        };
      },
    });

    const { runListingAgent } = await import("../agent");

    const input: RunAgentInput = {
      listingId: "test-000",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    };

    await expect(runListingAgent(input)).rejects.toThrow("ENOENT");
  });

  it("cleans up temp directory in finally block", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(validOutput));

    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "result",
          subtype: "success",
          total_cost_usd: 0.01,
          is_error: false,
        };
      },
    });

    const { runListingAgent } = await import("../agent");

    await runListingAgent({
      listingId: "test-cleanup",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    });

    expect(mockRm).toHaveBeenCalledWith(
      "/tmp/listwell-agent-abc123",
      { recursive: true, force: true },
    );
  });

  it("cleans up temp directory even on error", async () => {
    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "result",
          subtype: "error_during_execution",
          total_cost_usd: 0.01,
          is_error: true,
          errors: ["Some error"],
        };
      },
    });

    const { runListingAgent } = await import("../agent");

    await expect(
      runListingAgent({
        listingId: "test-cleanup-error",
        imageUrls: ["https://blob.example.com/img.jpg"],
        userDescription: null,
      }),
    ).rejects.toThrow();

    expect(mockRm).toHaveBeenCalledWith(
      "/tmp/listwell-agent-abc123",
      { recursive: true, force: true },
    );
  });

  it("accumulates log entries from assistant messages", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify(validOutput));

    mockQuery.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "assistant",
          message: {
            content: [
              { type: "text", text: "Analyzing the photos..." },
            ],
          },
        };
        yield {
          type: "assistant",
          message: {
            content: [
              {
                type: "tool_use",
                name: "WebSearch",
                input: { query: "drill prices" },
              },
            ],
          },
        };
        yield {
          type: "result",
          subtype: "success",
          total_cost_usd: 0.05,
          is_error: false,
        };
      },
    });

    const { runListingAgent } = await import("../agent");

    await runListingAgent({
      listingId: "test-log",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    });

    // DB update should have been called multiple times for log flushes
    // Initial "Starting analysis..." + 2 assistant messages + final "Listing generated"
    expect(mockUpdate).toHaveBeenCalled();
  });
});
