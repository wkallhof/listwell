import { Sandbox } from "@vercel/sandbox";
import { Writable } from "node:stream";
import { extname } from "node:path";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { listings } from "@/db/schema";
import { uploadBuffer } from "@/lib/blob";
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
  transcriptUrl: string | null;
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
  localImagePaths: string[],
  userDescription: string | null,
): string {
  const imageList = localImagePaths
    .map((path, i) => `- Image ${i + 1}: ${path}`)
    .join("\n");

  const descriptionSection = userDescription
    ? `## Seller's Description\n${userDescription}`
    : "## Seller's Description\nNo description provided. Analyze the photos to identify the item.";

  return [
    "Generate a marketplace listing for the following item.",
    "",
    "## Photos (local files — use Read tool to view each one)",
    imageList,
    "",
    descriptionSection,
    "",
    "IMPORTANT: You MUST use the Read tool to view EVERY image file listed above before proceeding. The images are your primary source of information. If any image cannot be read, STOP and report the error.",
    "",
    "After viewing all images, research comparable prices online, and generate a complete listing.",
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

interface DownloadedImage {
  localPath: string;
  buffer: Buffer;
}

async function downloadImages(
  imageUrls: string[],
): Promise<DownloadedImage[]> {
  const results: DownloadedImage[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const ext = extname(new URL(url).pathname) || ".jpg";
    const localPath = `images/photo-${i + 1}${ext}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to download image ${i + 1}: HTTP ${response.status} from ${url}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      throw new Error(`Image ${i + 1} is empty (0 bytes) from ${url}`);
    }

    results.push({ localPath, buffer });
  }

  return results;
}

async function uploadTranscript(
  listingId: string,
  transcript: string[],
): Promise<string | null> {
  if (transcript.length === 0) return null;

  try {
    const content = Buffer.from(transcript.join("\n"));
    const result = await uploadBuffer(
      content,
      `transcripts/${listingId}.jsonl`,
      "application/jsonl",
    );
    return result.url;
  } catch {
    // Transcript upload is non-critical — don't fail the pipeline
    return null;
  }
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

  // Download images server-side before creating sandbox.
  // This guarantees we can access R2 URLs and avoids relying on
  // the sandbox's network access or Claude Code's WebFetch tool.
  const downloadedImages = await downloadImages(imageUrls);

  agentLog.push({
    ts: Date.now(),
    type: "status",
    content: `Downloaded ${downloadedImages.length} image(s) for analysis`,
  });
  await flushAgentLog(listingId, agentLog);

  const sandbox = await Sandbox.create({
    runtime: "node22",
    timeout: 300_000,
  });

  const rawTranscript: string[] = [];

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

    // Write CLAUDE.md, user prompt, and image files to sandbox
    const systemPrompt = buildListingAgentPrompt(SANDBOX_DIR);
    const localImagePaths = downloadedImages.map(
      (img) => `${SANDBOX_DIR}/${img.localPath}`,
    );
    const userPrompt = buildUserPrompt(localImagePaths, userDescription);

    await sandbox.writeFiles([
      { path: "CLAUDE.md", content: Buffer.from(systemPrompt) },
      { path: "user-prompt.txt", content: Buffer.from(userPrompt) },
      ...downloadedImages.map((img) => ({
        path: img.localPath,
        content: img.buffer,
      })),
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

    // Stream progress via Writable — also accumulate raw transcript lines
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

          rawTranscript.push(trimmed);

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

    // Upload transcript to R2 (non-blocking, best-effort)
    const transcriptUrl = await uploadTranscript(listingId, rawTranscript);

    return { output: result, costUsd: 0, transcriptUrl };
  } catch (error) {
    agentLog.push({
      ts: Date.now(),
      type: "error",
      content:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
    await flushAgentLog(listingId, agentLog);

    // Still upload transcript on failure — this is the most valuable case for debugging
    const transcriptUrl = await uploadTranscript(listingId, rawTranscript);

    const enrichedError =
      error instanceof Error ? error : new Error("Unknown error occurred");
    (enrichedError as Error & { transcriptUrl?: string }).transcriptUrl =
      transcriptUrl ?? undefined;

    throw enrichedError;
  } finally {
    await sandbox.stop().catch(() => {});
  }
}
