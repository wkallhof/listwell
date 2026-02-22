import Anthropic from "@anthropic-ai/sdk";

import type {
  AgentProvider,
  AgentProviderInput,
  AgentProviderResult,
} from "../agent-provider";
import { parseAgentOutput } from "../parse-agent-output";
import { buildListingInstructions } from "../prompts/listing-instructions";
import { buildDirectApiOutputInstructions } from "../prompts/direct-api-output-instructions";

type Base64ImageSource = Anthropic.Base64ImageSource;
type TextBlockParam = Anthropic.TextBlockParam;
type ContentBlockParam = Anthropic.ContentBlockParam;
type MessageParam = Anthropic.MessageParam;
type Tool = Anthropic.Tool;

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 8192;
const MAX_SEARCH_TURNS = 10;

// Rough cost per million tokens (Sonnet 4.5 pricing)
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

function buildSystemPrompt(): string {
  const instructions = buildListingInstructions();
  const outputInstructions = buildDirectApiOutputInstructions();
  return `${instructions}\n\n${outputInstructions}`;
}

function buildUserContent(
  images: AgentProviderInput["images"],
  userDescription: string | null,
): ContentBlockParam[] {
  const blocks: ContentBlockParam[] = [];

  // Add images as base64 content blocks
  for (const img of images) {
    blocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mimeType as Base64ImageSource["media_type"],
        data: img.buffer.toString("base64"),
      },
    });
  }

  // Add text prompt
  const descriptionSection = userDescription
    ? `Seller's Description: ${userDescription}`
    : "No seller description provided. Analyze the photos to identify the item.";

  blocks.push({
    type: "text",
    text: [
      "Generate a marketplace listing for the item shown in the photos above.",
      "",
      descriptionSection,
      "",
      `There are ${images.length} photo(s) of the item attached above. Analyze them carefully.`,
      "",
      "Research comparable prices online, then generate a complete listing.",
    ].join("\n"),
  } satisfies TextBlockParam);

  return blocks;
}

function estimateCost(
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    (inputTokens / 1_000_000) * INPUT_COST_PER_M +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_M
  );
}

/**
 * Extract JSON from a text response that may contain markdown fences or surrounding text.
 */
function extractJson(text: string): unknown {
  // Try direct parse first
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through
  }

  // Try extracting from markdown code fence
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }

  // Try finding first { ... last }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("Could not extract JSON from agent response");
}

export function createAnthropicApiProvider(): AgentProvider {
  return {
    name: "anthropic-api",

    async run(input: AgentProviderInput): Promise<AgentProviderResult> {
      const { images, userDescription, onProgress } = input;

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY environment variable is required");
      }

      const client = new Anthropic({ apiKey });
      const systemPrompt = buildSystemPrompt();
      const transcriptLines: string[] = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      // Build conversation with multi-turn for web_search
      const messages: MessageParam[] = [
        { role: "user", content: buildUserContent(images, userDescription) },
      ];

      const tools: (Tool | Anthropic.WebSearchTool20250305)[] = [
        { type: "web_search_20250305", name: "web_search" },
      ];

      onProgress({
        ts: Date.now(),
        type: "status",
        content: "Analyzing images and researching prices via Anthropic API...",
      });

      // Multi-turn loop: keep going while the model wants to use tools
      for (let turn = 0; turn < MAX_SEARCH_TURNS; turn++) {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages,
          tools,
        });

        // Collect streaming text for real-time progress
        let currentText = "";

        stream.on("text", (text) => {
          currentText += text;
        });

        const message = await stream.finalMessage();

        // Track usage
        totalInputTokens += message.usage.input_tokens;
        totalOutputTokens += message.usage.output_tokens;

        // Log transcript
        transcriptLines.push(JSON.stringify({
          turn,
          role: "assistant",
          content: message.content,
          usage: message.usage,
          stop_reason: message.stop_reason,
        }));

        // Process content blocks for progress reporting
        for (const block of message.content) {
          if (block.type === "web_search_tool_result") {
            const searchContent = Array.isArray(block.content)
              ? block.content : [];
            for (const result of searchContent) {
              if (result.type === "web_search_result") {
                onProgress({
                  ts: Date.now(),
                  type: "search",
                  content: `Found: ${result.title} (${result.url})`,
                });
              }
            }
          } else if (block.type === "text" && block.text) {
            onProgress({
              ts: Date.now(),
              type: "text",
              content: block.text.slice(0, 200),
            });
          }
        }

        // If the model stopped normally (not waiting for tool results), we're done
        if (message.stop_reason === "end_turn") {
          // Extract JSON from the final text block
          const textBlocks = message.content.filter(
            (b): b is Anthropic.TextBlock => b.type === "text",
          );
          const finalText = textBlocks.map((b) => b.text).join("\n");

          if (!finalText.trim()) {
            throw new Error("Agent produced no text output");
          }

          const raw = extractJson(finalText);
          const output = parseAgentOutput(raw);

          return {
            output,
            costUsd: estimateCost(totalInputTokens, totalOutputTokens),
            transcriptLines,
          };
        }

        // If stop_reason is "tool_use", we need to continue the conversation
        // by appending the assistant message and a user message with tool results.
        // For server-side tools (web_search), the API handles tool execution
        // automatically — we only need to continue if stop_reason !== "end_turn".
        // If it's not end_turn and not tool_use, something unexpected happened.
        if (message.stop_reason !== "tool_use") {
          // Might be max_tokens or something else — try to extract output anyway
          const textBlocks = message.content.filter(
            (b): b is Anthropic.TextBlock => b.type === "text",
          );
          const finalText = textBlocks.map((b) => b.text).join("\n");

          if (finalText.trim()) {
            try {
              const raw = extractJson(finalText);
              const output = parseAgentOutput(raw);
              return {
                output,
                costUsd: estimateCost(totalInputTokens, totalOutputTokens),
                transcriptLines,
              };
            } catch {
              // Could not extract valid output
            }
          }

          throw new Error(
            `Unexpected stop reason: ${message.stop_reason}. Last text: ${currentText.slice(0, 500)}`,
          );
        }

        // Append assistant response and empty tool results to continue conversation
        messages.push({ role: "assistant", content: message.content });

        // Build tool result blocks for any tool_use blocks
        const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
        for (const block of message.content) {
          if (block.type === "tool_use") {
            // Server-side tools like web_search are handled by the API,
            // but we still need to acknowledge client-side tool_use if any.
            toolResultBlocks.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: "Tool execution handled by server.",
            });
          }
        }

        if (toolResultBlocks.length > 0) {
          messages.push({ role: "user", content: toolResultBlocks });
        }

        onProgress({
          ts: Date.now(),
          type: "status",
          content: `Continuing research (turn ${turn + 2})...`,
        });
      }

      throw new Error(
        `Agent exceeded maximum search turns (${MAX_SEARCH_TURNS})`,
      );
    },
  };
}
