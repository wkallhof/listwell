import { query } from "@anthropic-ai/claude-agent-sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { listings } from "@/db/schema";

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
  structuredOutput: unknown,
): ListingAgentOutput {
  const parsed = listingAgentOutputSchema.safeParse(structuredOutput);

  if (!parsed.success) {
    throw new Error(
      `Agent output validation failed: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}

export async function runListingAgent(
  input: RunAgentInput,
): Promise<RunAgentResult> {
  const { listingId, imageUrls, userDescription } = input;

  await updatePipelineStep(listingId, "ANALYZING");

  const outputSchema = z.toJSONSchema(listingAgentOutputSchema);

  let result: ListingAgentOutput | null = null;
  let totalCost = 0;

  for await (const message of query({
    prompt: buildUserPrompt(imageUrls, userDescription),
    options: {
      systemPrompt: buildListingAgentPrompt(),
      model: "claude-sonnet-4-5-20250929",
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      allowedTools: ["WebSearch", "WebFetch"],
      maxTurns: 15,
      outputFormat: {
        type: "json_schema",
        schema: outputSchema,
      },
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
    if (message.type !== "result") {
      continue;
    }

    totalCost = message.total_cost_usd;

    if (message.is_error) {
      const errorMsg =
        "errors" in message
          ? (message.errors as string[]).join("; ")
          : "Agent execution failed";
      throw new Error(errorMsg);
    }

    if (message.subtype === "success" && message.structured_output) {
      await updatePipelineStep(listingId, "GENERATING");
      result = parseAgentOutput(message.structured_output);
    }
  }

  if (!result) {
    throw new Error("Agent completed without producing structured output");
  }

  return { output: result, costUsd: totalCost };
}
