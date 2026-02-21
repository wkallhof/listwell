import { Sandbox } from "e2b";
import { extname } from "node:path";
import { eq } from "drizzle-orm";

import { db } from "@listwell/db";
import { listings } from "@listwell/db/schema";
import { uploadBuffer } from "../blob";
import type { AgentLogEntry } from "@listwell/shared";
import {
  listingAgentOutputSchema,
  type ListingAgentOutput,
} from "@listwell/shared";
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

const TOOL_LOG_MAP: Record<string, { type: AgentLogEntry["type"]; field: string; prefix: string }> = {
  WebSearch: { type: "search", field: "query", prefix: "Searching" },
  WebFetch: { type: "fetch", field: "url", prefix: "Fetching" },
  Write: { type: "write", field: "", prefix: "Writing listing output" },
};

export function extractLogEntries(
  contentBlocks: ContentBlock[],
): AgentLogEntry[] {
  const entries: AgentLogEntry[] = [];
  const now = Date.now();

  for (const block of contentBlocks) {
    if (block.type === "text" && block.text) {
      entries.push({ ts: now, type: "text", content: block.text.slice(0, 200) });
      continue;
    }

    if (block.type !== "tool_use" || !block.name) continue;

    const mapping = TOOL_LOG_MAP[block.name];
    if (!mapping) continue;

    const value = mapping.field && typeof block.input?.[mapping.field] === "string"
      ? block.input[mapping.field] as string
      : "";
    const content = value ? `${mapping.prefix}: ${value}` : mapping.prefix;

    entries.push({ ts: now, type: mapping.type, content });
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
    return null;
  }
}

const SANDBOX_DIR = "/home/user";
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

  const downloadedImages = await downloadImages(imageUrls);

  agentLog.push({
    ts: Date.now(),
    type: "status",
    content: `Downloaded ${downloadedImages.length} image(s) for analysis`,
  });
  await flushAgentLog(listingId, agentLog);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const sandbox = await Sandbox.create("claude", {
    envs: { ANTHROPIC_API_KEY: apiKey },
    timeoutMs: 300_000,
  });

  const rawTranscript: string[] = [];

  try {
    const systemPrompt = buildListingAgentPrompt(SANDBOX_DIR);
    const localImagePaths = downloadedImages.map(
      (img) => `${SANDBOX_DIR}/${img.localPath}`,
    );
    const userPrompt = buildUserPrompt(localImagePaths, userDescription);

    await sandbox.files.write(`${SANDBOX_DIR}/CLAUDE.md`, systemPrompt);
    await sandbox.files.write(`${SANDBOX_DIR}/user-prompt.txt`, userPrompt);
    for (const img of downloadedImages) {
      const bytes = Uint8Array.from(img.buffer);
      await sandbox.files.write(
        `${SANDBOX_DIR}/${img.localPath}`,
        bytes.buffer as ArrayBuffer,
      );
    }

    const cliCommand = [
      "claude",
      `-p "$(cat ${SANDBOX_DIR}/user-prompt.txt)"`,
      "--dangerously-skip-permissions",
      "--output-format stream-json",
      "--model claude-sonnet-4-5-20250929",
      "--max-turns 15",
      "--verbose",
    ].join(" ");

    let hasError = false;
    let errorMessage = "";
    let stdoutBuffer = "";
    const stderrChunks: string[] = [];

    function processLine(line: string): void {
      const trimmed = line.trim();
      if (!trimmed) return;

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

    const proc = await sandbox.commands.run(cliCommand, {
      cwd: SANDBOX_DIR,
      onStdout: (data) => {
        stdoutBuffer += data;
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() ?? "";
        for (const line of lines) {
          processLine(line);
        }
      },
      onStderr: (data) => {
        stderrChunks.push(data);
      },
      timeoutMs: 300_000,
    });

    // Process any remaining data in the buffer
    if (stdoutBuffer.trim()) {
      processLine(stdoutBuffer);
    }

    if (proc.exitCode !== 0 || hasError) {
      const stderr = stderrChunks.join("");
      const detail = hasError ? errorMessage : stderr || `exit code ${proc.exitCode}`;
      throw new Error(`Claude CLI failed: ${detail}`);
    }

    await updatePipelineStep(listingId, "GENERATING");

    const outputText = await sandbox.files.read(
      `${SANDBOX_DIR}/${OUTPUT_FILENAME}`,
    );

    if (!outputText) {
      throw new Error("Agent did not produce output file");
    }

    const raw = JSON.parse(outputText) as unknown;
    const result = parseAgentOutput(raw);

    agentLog.push({
      ts: Date.now(),
      type: "complete",
      content: "Listing generated",
    });
    await flushAgentLog(listingId, agentLog);

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

    const transcriptUrl = await uploadTranscript(listingId, rawTranscript);

    const enrichedError =
      error instanceof Error ? error : new Error("Unknown error occurred");
    (enrichedError as Error & { transcriptUrl?: string }).transcriptUrl =
      transcriptUrl ?? undefined;

    throw enrichedError;
  } finally {
    await sandbox.kill().catch(() => {});
  }
}
