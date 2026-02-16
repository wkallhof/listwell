import { query } from "@anthropic-ai/claude-agent-sdk";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

function parseAgentOutput(
  raw: unknown,
): ListingAgentOutput {
  const parsed = listingAgentOutputSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(
      `Agent output validation failed: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface SDKAssistantMessageLike {
  type: "assistant";
  message: {
    content: ContentBlock[];
  };
}

export function extractLogEntries(
  message: SDKAssistantMessageLike,
): AgentLogEntry[] {
  const entries: AgentLogEntry[] = [];
  const now = Date.now();

  for (const block of message.message.content) {
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

export async function runListingAgent(
  input: RunAgentInput,
): Promise<RunAgentResult> {
  const { listingId, imageUrls, userDescription } = input;

  await updatePipelineStep(listingId, "ANALYZING");

  const workDir = await mkdtemp(join(tmpdir(), "listwell-agent-"));
  const agentLog: AgentLogEntry[] = [
    { ts: Date.now(), type: "status", content: "Starting analysis..." },
  ];
  await flushAgentLog(listingId, agentLog);

  let totalCost = 0;

  try {
    for await (const message of query({
      prompt: buildUserPrompt(imageUrls, userDescription),
      options: {
        systemPrompt: buildListingAgentPrompt(workDir),
        model: "claude-sonnet-4-5-20250929",
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        allowedTools: ["WebSearch", "WebFetch", "Write"],
        tools: ["WebSearch", "WebFetch", "Write"],
        cwd: workDir,
        maxTurns: 15,
        hooks: {
          PostToolUse: [
            {
              matcher: "WebSearch",
              hooks: [
                async () => {
                  await updatePipelineStep(listingId, "RESEARCHING");
                  return {};
                },
              ],
            },
          ],
        },
      },
    })) {
      if (message.type === "assistant") {
        const entries = extractLogEntries(
          message as SDKAssistantMessageLike,
        );
        if (entries.length > 0) {
          agentLog.push(...entries);
          await flushAgentLog(listingId, agentLog);
        }
      }

      if (message.type === "result") {
        totalCost = message.total_cost_usd;

        if (message.is_error) {
          const errorMsg =
            "errors" in message
              ? (message.errors as string[]).join("; ")
              : "Agent execution failed";
          throw new Error(errorMsg);
        }
      }
    }

    await updatePipelineStep(listingId, "GENERATING");

    const outputPath = join(workDir, "listing-output.json");
    const raw = await readFile(outputPath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    const result = parseAgentOutput(parsed);

    agentLog.push({
      ts: Date.now(),
      type: "complete",
      content: "Listing generated",
    });
    await flushAgentLog(listingId, agentLog);

    return { output: result, costUsd: totalCost };
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
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
