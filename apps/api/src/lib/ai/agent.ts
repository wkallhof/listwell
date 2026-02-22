import { extname } from "node:path";
import { eq } from "drizzle-orm";

import { db } from "@listwell/db";
import { listings } from "@listwell/db/schema";
import { uploadBuffer } from "../blob";
import type { AgentLogEntry } from "@listwell/shared";
import type { ListingAgentOutput } from "@listwell/shared";
import { getAgentProvider } from "./agent-provider";
import type { AgentImage } from "./agent-provider";

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

async function flushAgentLog(
  listingId: string,
  log: AgentLogEntry[],
): Promise<void> {
  await db
    .update(listings)
    .set({ agentLog: log, updatedAt: new Date() })
    .where(eq(listings.id, listingId));
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
  };
  return map[ext.toLowerCase()] ?? "image/jpeg";
}

async function downloadImages(imageUrls: string[]): Promise<AgentImage[]> {
  const results: AgentImage[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const ext = extname(new URL(url).pathname) || ".jpg";
    const filename = `photo-${i + 1}${ext}`;

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

    results.push({ filename, buffer, mimeType: getMimeType(ext) });
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

export async function runListingAgent(
  input: RunAgentInput,
): Promise<RunAgentResult> {
  const { listingId, imageUrls, userDescription } = input;

  await updatePipelineStep(listingId, "ANALYZING");

  const agentLog: AgentLogEntry[] = [
    { ts: Date.now(), type: "status", content: "Starting analysis..." },
  ];
  await flushAgentLog(listingId, agentLog);

  // Download images (shared across all providers)
  const images = await downloadImages(imageUrls);

  agentLog.push({
    ts: Date.now(),
    type: "status",
    content: `Downloaded ${images.length} image(s) for analysis`,
  });
  await flushAgentLog(listingId, agentLog);

  // Progress callback — providers call this, orchestrator writes to DB
  const onProgress = (entry: AgentLogEntry): void => {
    agentLog.push(entry);
    flushAgentLog(listingId, agentLog).catch(() => {});

    if (entry.type === "search") {
      updatePipelineStep(listingId, "RESEARCHING").catch(() => {});
    }
  };

  try {
    const provider = await getAgentProvider();

    agentLog.push({
      ts: Date.now(),
      type: "status",
      content: `Using agent provider: ${provider.name}`,
    });
    await flushAgentLog(listingId, agentLog);

    const result = await provider.run({ images, userDescription, onProgress });

    await updatePipelineStep(listingId, "GENERATING");

    agentLog.push({
      ts: Date.now(),
      type: "complete",
      content: "Listing generated",
    });
    await flushAgentLog(listingId, agentLog);

    const transcriptUrl = await uploadTranscript(
      listingId,
      result.transcriptLines,
    );

    return {
      output: result.output,
      costUsd: result.costUsd,
      transcriptUrl,
    };
  } catch (error) {
    agentLog.push({
      ts: Date.now(),
      type: "error",
      content:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
    await flushAgentLog(listingId, agentLog);

    const transcriptUrl = await uploadTranscript(listingId, []);

    const enrichedError =
      error instanceof Error ? error : new Error("Unknown error occurred");
    (enrichedError as Error & { transcriptUrl?: string }).transcriptUrl =
      transcriptUrl ?? undefined;

    throw enrichedError;
  }
}
