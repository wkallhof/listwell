import { Sandbox } from "@vercel/sandbox";
import { Writable } from "node:stream";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { listings } from "@/db/schema";
import type { AgentLogEntry } from "@/types";

import {
  listingAgentOutputSchema,
  type ListingAgentOutput,
} from "./agent-output-schema";
import { buildListingAgentPrompt } from "./prompts/listing-agent-prompt";

export interface RunAgentInput {
  listingId: string;
  imageUrls: string[];
  userDescription: string | null;
}

export interface RunAgentResult {
  output: ListingAgentOutput;
  costUsd: number;
}

export interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

type AgentPipelineStep = "ANALYZING" | "RESEARCHING" | "GENERATING";

async function updatePipelineStep(
  listingId: string,
  step: AgentPipelineStep,
): Promise<void> {
  await db
    .update(listings)
    .set({ pipelineStep: step, updatedAt: new Date() })
    .where(eq(listings.id, listingId));
}

function buildUserPrompt(
  imageUrls: string[],
  userDescription: string | null,
): string {
  const imageList = imageUrls
    .map((url, i) => `- Image ${i + 1}: ${url}`)
    .join("\n");

  const descriptionSection = userDescription
    ? `## Seller's Description\n${userDescription}`
    : "## Seller's Description\nNo description provided. Analyze the photos to identify the item.";

  return [
    "Generate a marketplace listing for the following item.",
    "",
    "## Photos",
    imageList,
    "",
    descriptionSection,
    "",
    "Please analyze the images, research comparable prices online, and generate a complete listing.",
  ].join("\n");
}

function parseAgentOutput(raw: unknown): ListingAgentOutput {
  const parsed = listingAgentOutputSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(
      `Agent output validation failed: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

export function extractLogEntries(
  contentBlocks: ContentBlock[],
): AgentLogEntry[] {
  const entries: AgentLogEntry[] = [];
  const now = Date.now();

  for (const block of contentBlocks) {
    if (block.type === "text" && block.text) {
      entries.push({
        ts: now,
        type: "text",
        content: block.text.slice(0, 200),
      });
    } else if (block.type === "tool_use" && block.name === "WebSearch") {
      const queryText =
        typeof block.input?.query === "string" ? block.input.query : "...";
      entries.push({
        ts: now,
        type: "search",
        content: `Searching: ${queryText}`,
      });
    } else if (block.type === "tool_use" && block.name === "WebFetch") {
      const url =
        typeof block.input?.url === "string" ? block.input.url : "...";
      entries.push({
        ts: now,
        type: "fetch",
        content: `Fetching: ${url}`,
      });
    } else if (block.type === "tool_use" && block.name === "Write") {
      entries.push({
        ts: now,
        type: "write",
        content: "Writing listing output",
      });
    }
  }

  return entries;
}

async function flushAgentLog(
  listingId: string,
  log: AgentLogEntry[],
): Promise<void> {
  await db
    .update(listings)
    .set({ agentLog: log, updatedAt: new Date() })
    .where(eq(listings.id, listingId));
}

const SANDBOX_DIR = "/vercel/sandbox";
const OUTPUT_FILENAME = "listing-output.json";

export async function runListingAgent(
  input: RunAgentInput,
): Promise<RunAgentResult> {
  const { listingId, imageUrls, userDescription } = input;

  await updatePipelineStep(listingId, "ANALYZING");

  const agentLog: AgentLogEntry[] = [
    { ts: Date.now(), type: "status", content: "Starting analysis..." },
  ];
  await flushAgentLog(listingId, agentLog);

  const sandbox = await Sandbox.create({
    runtime: "node22",
    timeout: 300_000,
  });

  try {
    // Install Claude Code CLI
    const installResult = await sandbox.runCommand("sh", [
      "-c",
      "curl -fsSL https://claude.ai/install.sh | bash",
    ]);
    if (installResult.exitCode !== 0) {
      let stderr = "";
      try {
        stderr = await (installResult.stderr as () => Promise<string>)();
      } catch {
        // Failed to read stderr
      }
      throw new Error(`Failed to install Claude CLI: ${stderr}`);
    }

    // Write CLAUDE.md (agent instructions) and user prompt file
    const systemPrompt = buildListingAgentPrompt(SANDBOX_DIR);
    const userPrompt = buildUserPrompt(imageUrls, userDescription);

    await sandbox.writeFiles([
      { path: "CLAUDE.md", content: Buffer.from(systemPrompt) },
      { path: "user-prompt.txt", content: Buffer.from(userPrompt) },
    ]);

    // Validate API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }

    // Build CLI command — read prompt from file to avoid shell escaping issues
    const cliCommand = [
      `ANTHROPIC_API_KEY="${apiKey}"`,
      "claude",
      '-p "$(cat /vercel/sandbox/user-prompt.txt)"',
      "--dangerously-skip-permissions",
      "--output-format stream-json",
      "--model claude-sonnet-4-5-20250929",
      "--max-turns 15",
      "--verbose",
    ].join(" ");

    // Stream progress via Writable
    let isCompleted = false;
    let hasError = false;
    let errorMessage = "";

    const stdoutStream = new Writable({
      write(chunk, _encoding, callback) {
        const text = chunk.toString();
        const lines = text.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed) as {
              type?: string;
              message?: { content?: ContentBlock[] };
              is_error?: boolean;
              errors?: string[];
            };

            if (
              parsed.type === "assistant" &&
              Array.isArray(parsed.message?.content)
            ) {
              const entries = extractLogEntries(parsed.message!.content!);
              if (entries.length > 0) {
                agentLog.push(...entries);
                flushAgentLog(listingId, agentLog).catch(() => {});

                for (const entry of entries) {
                  if (entry.type === "search") {
                    updatePipelineStep(listingId, "RESEARCHING").catch(
                      () => {},
                    );
                  }
                }
              }
            } else if (parsed.type === "result") {
              isCompleted = true;
              if (parsed.is_error) {
                hasError = true;
                errorMessage = Array.isArray(parsed.errors)
                  ? parsed.errors.join("; ")
                  : "Agent execution failed";
              }
            }
          } catch {
            // Not valid JSON, skip
          }
        }

        callback();
      },
    });

    // Run Claude CLI in detached mode with streaming output
    await sandbox.runCommand({
      cmd: "sh",
      args: ["-c", cliCommand],
      detached: true,
      stdout: stdoutStream,
    });

    // Wait for CLI to complete (sandbox timeout is the safety net)
    while (!isCompleted) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (hasError) {
      throw new Error(errorMessage);
    }

    // Read output file from sandbox
    await updatePipelineStep(listingId, "GENERATING");

    const outputBuffer = await sandbox.readFileToBuffer({
      path: `${SANDBOX_DIR}/${OUTPUT_FILENAME}`,
    });

    if (!outputBuffer) {
      throw new Error("Agent did not produce output file");
    }

    const raw = JSON.parse(outputBuffer.toString()) as unknown;
    const result = parseAgentOutput(raw);

    agentLog.push({
      ts: Date.now(),
      type: "complete",
      content: "Listing generated",
    });
    await flushAgentLog(listingId, agentLog);

    return { output: result, costUsd: 0 };
  } catch (error) {
    agentLog.push({
      ts: Date.now(),
      type: "error",
      content:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
    await flushAgentLog(listingId, agentLog);
    throw error;
  } finally {
    await sandbox.stop().catch(() => {});
  }
}
