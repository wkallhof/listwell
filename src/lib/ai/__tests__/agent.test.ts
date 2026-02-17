// @vitest-environment node
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Writable } from "node:stream";

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

// Mock @vercel/sandbox
const mockRunCommand = vi.fn();
const mockWriteFiles = vi.fn();
const mockReadFileToBuffer = vi.fn();
const mockStop = vi.fn();
const mockSandboxInstance = {
  runCommand: mockRunCommand,
  writeFiles: mockWriteFiles,
  readFileToBuffer: mockReadFileToBuffer,
  stop: mockStop,
};
const mockSandboxCreate = vi.fn().mockResolvedValue(mockSandboxInstance);

vi.mock("@vercel/sandbox", () => ({
  Sandbox: {
    create: (...args: unknown[]) => mockSandboxCreate(...args),
  },
}));

import { buildListingAgentPrompt } from "../prompts/listing-agent-prompt";
import { listingAgentOutputSchema } from "../agent-output-schema";
import { extractLogEntries } from "../agent";
import type { RunAgentInput, ContentBlock } from "../agent";

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
  it("extracts text entries from content blocks", () => {
    const blocks: ContentBlock[] = [
      { type: "text", text: "Analyzing the item photos..." },
    ];

    const entries = extractLogEntries(blocks);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("text");
    expect(entries[0].content).toBe("Analyzing the item photos...");
  });

  it("truncates text entries to 200 chars", () => {
    const longText = "A".repeat(300);
    const blocks: ContentBlock[] = [{ type: "text", text: longText }];

    const entries = extractLogEntries(blocks);

    expect(entries[0].content).toHaveLength(200);
  });

  it("extracts WebSearch tool_use entries", () => {
    const blocks: ContentBlock[] = [
      {
        type: "tool_use",
        name: "WebSearch",
        input: { query: "DeWalt drill price eBay" },
      },
    ];

    const entries = extractLogEntries(blocks);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("search");
    expect(entries[0].content).toBe("Searching: DeWalt drill price eBay");
  });

  it("extracts WebFetch tool_use entries", () => {
    const blocks: ContentBlock[] = [
      {
        type: "tool_use",
        name: "WebFetch",
        input: { url: "https://ebay.com/listing/123" },
      },
    ];

    const entries = extractLogEntries(blocks);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("fetch");
    expect(entries[0].content).toBe("Fetching: https://ebay.com/listing/123");
  });

  it("extracts Write tool_use entries", () => {
    const blocks: ContentBlock[] = [
      {
        type: "tool_use",
        name: "Write",
        input: { file_path: "listing-output.json" },
      },
    ];

    const entries = extractLogEntries(blocks);

    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("write");
    expect(entries[0].content).toBe("Writing listing output");
  });

  it("handles multiple content blocks", () => {
    const blocks: ContentBlock[] = [
      { type: "text", text: "Let me search for prices" },
      {
        type: "tool_use",
        name: "WebSearch",
        input: { query: "drill prices" },
      },
    ];

    const entries = extractLogEntries(blocks);

    expect(entries).toHaveLength(2);
    expect(entries[0].type).toBe("text");
    expect(entries[1].type).toBe("search");
  });

  it("ignores unknown tool types", () => {
    const blocks: ContentBlock[] = [
      {
        type: "tool_use",
        name: "UnknownTool",
        input: {},
      },
    ];

    const entries = extractLogEntries(blocks);

    expect(entries).toHaveLength(0);
  });

  it("handles empty content array", () => {
    const entries = extractLogEntries([]);

    expect(entries).toHaveLength(0);
  });

  it("uses fallback for missing query in WebSearch", () => {
    const blocks: ContentBlock[] = [
      {
        type: "tool_use",
        name: "WebSearch",
        input: {},
      },
    ];

    const entries = extractLogEntries(blocks);

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

  const savedApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockReturnValue({ where: vi.fn() });
    mockStop.mockResolvedValue(undefined);
    mockWriteFiles.mockResolvedValue(undefined);
    mockSandboxCreate.mockResolvedValue(mockSandboxInstance);
    process.env.ANTHROPIC_API_KEY = "sk-test-key";
  });

  afterEach(() => {
    if (savedApiKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = savedApiKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  function setupMocks(options?: {
    output?: Record<string, unknown>;
    streamMessages?: unknown[];
    installFails?: boolean;
    outputMissing?: boolean;
  }) {
    const {
      output = validOutput,
      streamMessages,
      installFails = false,
      outputMissing = false,
    } = options ?? {};

    // Default stream: just a result message
    const defaultStream = [
      { type: "result", is_error: false },
    ];
    const messages = streamMessages ?? defaultStream;

    mockRunCommand.mockImplementation(
      async (...args: unknown[]) => {
        // Object form = detached CLI execution
        if (typeof args[0] === "object" && args[0] !== null) {
          const opts = args[0] as { stdout?: Writable };
          if (opts.stdout) {
            for (const msg of messages) {
              opts.stdout.write(JSON.stringify(msg) + "\n");
            }
          }
          return {};
        }

        // Simple form = CLI install
        if (installFails) {
          return {
            exitCode: 1,
            stderr: async () => "install failed",
          };
        }
        return {
          exitCode: 0,
          stderr: async () => "",
        };
      },
    );

    if (outputMissing) {
      mockReadFileToBuffer.mockResolvedValue(null);
    } else {
      mockReadFileToBuffer.mockResolvedValue(
        Buffer.from(JSON.stringify(output)),
      );
    }
  }

  it("creates sandbox, installs CLI, and reads output", async () => {
    setupMocks();

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

    // Verify sandbox was created
    expect(mockSandboxCreate).toHaveBeenCalledWith({
      runtime: "node22",
      timeout: 300_000,
    });

    // Verify CLI was installed
    expect(mockRunCommand).toHaveBeenCalledWith("sh", [
      "-c",
      "curl -fsSL https://claude.ai/install.sh | bash",
    ]);

    // Verify CLAUDE.md and prompt were written
    expect(mockWriteFiles).toHaveBeenCalledTimes(1);
    const writtenFiles = mockWriteFiles.mock.calls[0][0] as Array<{
      path: string;
      content: Buffer;
    }>;
    expect(writtenFiles).toHaveLength(2);
    expect(writtenFiles[0].path).toBe("CLAUDE.md");
    expect(writtenFiles[1].path).toBe("user-prompt.txt");
    const promptContent = writtenFiles[1].content.toString();
    expect(promptContent).toContain("img1.jpg");
    expect(promptContent).toContain("img2.jpg");
    expect(promptContent).toContain("My old drill, works great");

    // Verify output was read
    expect(mockReadFileToBuffer).toHaveBeenCalledWith({
      path: "/vercel/sandbox/listing-output.json",
    });

    expect(result.output.title).toBe("Test Item");
    expect(result.costUsd).toBe(0);
  });

  it("handles missing user description", async () => {
    setupMocks({
      output: { ...validOutput, title: "Unknown Item" },
    });

    const { runListingAgent } = await import("../agent");

    const input: RunAgentInput = {
      listingId: "test-456",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    };

    const result = await runListingAgent(input);

    const writtenFiles = mockWriteFiles.mock.calls[0][0] as Array<{
      path: string;
      content: Buffer;
    }>;
    const promptContent = writtenFiles[1].content.toString();
    expect(promptContent).toContain(
      "No description provided. Analyze the photos to identify the item.",
    );
    expect(result.output.title).toBe("Unknown Item");
  });

  it("throws on CLI install failure", async () => {
    setupMocks({ installFails: true });

    const { runListingAgent } = await import("../agent");

    const input: RunAgentInput = {
      listingId: "test-install-fail",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    };

    await expect(runListingAgent(input)).rejects.toThrow(
      "Failed to install Claude CLI",
    );
  });

  it("throws on agent error result", async () => {
    setupMocks({
      streamMessages: [
        {
          type: "result",
          is_error: true,
          errors: ["API rate limit exceeded"],
        },
      ],
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
    setupMocks({ outputMissing: true });

    const { runListingAgent } = await import("../agent");

    const input: RunAgentInput = {
      listingId: "test-000",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    };

    await expect(runListingAgent(input)).rejects.toThrow(
      "Agent did not produce output file",
    );
  });

  it("stops sandbox in finally block", async () => {
    setupMocks();

    const { runListingAgent } = await import("../agent");

    await runListingAgent({
      listingId: "test-cleanup",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    });

    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("stops sandbox even on error", async () => {
    setupMocks({ installFails: true });

    const { runListingAgent } = await import("../agent");

    await expect(
      runListingAgent({
        listingId: "test-cleanup-error",
        imageUrls: ["https://blob.example.com/img.jpg"],
        userDescription: null,
      }),
    ).rejects.toThrow();

    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("accumulates log entries from assistant messages", async () => {
    setupMocks({
      streamMessages: [
        {
          type: "assistant",
          message: {
            content: [
              { type: "text", text: "Analyzing the photos..." },
            ],
          },
        },
        {
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
        },
        { type: "result", is_error: false },
      ],
    });

    const { runListingAgent } = await import("../agent");

    await runListingAgent({
      listingId: "test-log",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    });

    // DB update should have been called for log flushes and pipeline steps
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("passes CLI command with correct flags", async () => {
    setupMocks();

    const { runListingAgent } = await import("../agent");

    await runListingAgent({
      listingId: "test-flags",
      imageUrls: ["https://blob.example.com/img.jpg"],
      userDescription: null,
    });

    // Find the detached runCommand call (object form)
    const detachedCall = mockRunCommand.mock.calls.find(
      (call: unknown[]) => typeof call[0] === "object",
    );
    expect(detachedCall).toBeDefined();

    const opts = detachedCall![0] as { cmd: string; args: string[] };
    const cliCommand = opts.args[1];
    expect(cliCommand).toContain("--dangerously-skip-permissions");
    expect(cliCommand).toContain("--output-format stream-json");
    expect(cliCommand).toContain("--model claude-sonnet-4-5-20250929");
    expect(cliCommand).toContain("--max-turns 15");
    expect(cliCommand).toContain("--verbose");
    expect(cliCommand).toContain("ANTHROPIC_API_KEY=");
  });

  it("throws when ANTHROPIC_API_KEY is missing", async () => {
    setupMocks();
    delete process.env.ANTHROPIC_API_KEY;

    const { runListingAgent } = await import("../agent");

    await expect(
      runListingAgent({
        listingId: "test-no-key",
        imageUrls: ["https://blob.example.com/img.jpg"],
        userDescription: null,
      }),
    ).rejects.toThrow("ANTHROPIC_API_KEY environment variable is required");
  });
});
