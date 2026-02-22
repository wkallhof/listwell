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
const COMMAND_TIMEOUT_MS = 270_000;
const SANDBOX_TIMEOUT_MS = 330_000;

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
    envs: {
      ANTHROPIC_API_KEY: apiKey,
      DISABLE_AUTOUPDATE: "1",
      DO_NOT_TRACK: "1",
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
    },
    timeoutMs: SANDBOX_TIMEOUT_MS,
  });

  const rawTranscript: string[] = [];

  try {
    // --- Pre-flight checks ---
    const versionResult = await sandbox.commands.run("claude --version 2>&1", {
      timeoutMs: 30_000,
    });
    const cliVersion = (versionResult.stdout || versionResult.stderr).trim();
    agentLog.push({
      ts: Date.now(),
      type: "status",
      content: `CLI version: ${cliVersion} (exit ${versionResult.exitCode})`,
    });
    await flushAgentLog(listingId, agentLog);

    if (versionResult.exitCode !== 0) {
      throw new Error(`Claude CLI unavailable in sandbox: ${cliVersion}`);
    }

    const envResult = await sandbox.commands.run(
      'test -n "$ANTHROPIC_API_KEY" && echo "ok" || echo "missing"',
      { timeoutMs: 10_000 },
    );
    if (envResult.stdout.trim() !== "ok") {
      throw new Error("ANTHROPIC_API_KEY not set in sandbox environment");
    }

    // --- Write files to sandbox ---
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

    // Verify files landed correctly
    const fileCheck = await sandbox.commands.run(
      `ls -la ${SANDBOX_DIR}/CLAUDE.md ${SANDBOX_DIR}/user-prompt.txt ${SANDBOX_DIR}/images/ 2>&1`,
      { timeoutMs: 10_000 },
    );
    agentLog.push({
      ts: Date.now(),
      type: "status",
      content: `Sandbox files: ${fileCheck.stdout.trim().slice(0, 300)}`,
    });
    await flushAgentLog(listingId, agentLog);

    // --- Network connectivity check ---
    const netCheck = await sandbox.commands.run(
      'curl -s -m 10 -o /dev/null -w "%{http_code}" https://api.anthropic.com/v1/messages 2>&1',
      { timeoutMs: 15_000 },
    );
    agentLog.push({
      ts: Date.now(),
      type: "status",
      content: `Anthropic API reachability: HTTP ${netCheck.stdout.trim()} (exit ${netCheck.exitCode})`,
    });
    await flushAgentLog(listingId, agentLog);

    // --- Diagnose: what network calls does Claude CLI make? ---
    agentLog.push({
      ts: Date.now(),
      type: "status",
      content: "Tracing Claude CLI network calls (15s)...",
    });
    await flushAgentLog(listingId, agentLog);

    await sandbox.commands.run(
      "apt-get install -y strace >/dev/null 2>&1 || true",
      { timeoutMs: 30_000 },
    );

    const traceResult = await sandbox.commands.run(
      [
        'timeout 15 strace -f -e trace=connect -o /tmp/strace.txt',
        'claude -p "Say OK" --dangerously-skip-permissions --output-format json 2>/dev/null;',
        'grep -a "connect(" /tmp/strace.txt | grep -v "ENOENT\\|EINPROGRESS.*unix" | tail -20',
      ].join(" "),
      { timeoutMs: 50_000 },
    );
    agentLog.push({
      ts: Date.now(),
      type: "status",
      content: `Network trace: ${traceResult.stdout.trim().slice(0, 500) || "no connect calls found"}`,
    });
    await flushAgentLog(listingId, agentLog);

    // Also check ~/.claude/ state
    const configCheck = await sandbox.commands.run(
      "ls -la ~/.claude/ 2>&1; echo '---'; cat ~/.claude/statsig_metadata.json 2>&1 || true",
      { timeoutMs: 5_000 },
    );
    agentLog.push({
      ts: Date.now(),
      type: "status",
      content: `Claude config: ${configCheck.stdout.trim().slice(0, 400)}`,
    });
    await flushAgentLog(listingId, agentLog);

    // --- Build runner script ---
    const runnerScript = [
      "#!/bin/bash",
      'echo "[runner] Reading prompt..." >&2',
      `PROMPT=$(cat ${SANDBOX_DIR}/user-prompt.txt) || { echo "[runner] FAILED to read prompt" >&2; exit 1; }`,
      'echo "[runner] Prompt loaded (${#PROMPT} chars), starting claude..." >&2',
      `claude -p "$PROMPT" \\`,
      "  --dangerously-skip-permissions \\",
      "  --output-format stream-json \\",
      "  --model sonnet \\",
      "  --max-turns 15 \\",
      "  --verbose",
      "EXIT_CODE=$?",
      'echo "[runner] claude exited with code $EXIT_CODE" >&2',
      "exit $EXIT_CODE",
    ].join("\n");

    await sandbox.files.write(`${SANDBOX_DIR}/run-agent.sh`, runnerScript);
    await sandbox.commands.run(`chmod +x ${SANDBOX_DIR}/run-agent.sh`, {
      timeoutMs: 5_000,
    });

    // --- Execute Claude CLI ---
    let hasError = false;
    let errorMessage = "";
    let stdoutBuffer = "";
    const stderrChunks: string[] = [];
    let onStdoutCallCount = 0;

    function processLine(line: string): void {
      const trimmed = line.trim();
      if (!trimmed) return;

      rawTranscript.push(trimmed);

      try {
        const parsed = JSON.parse(trimmed) as {
          type?: string;
          subtype?: string;
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
        // Not valid JSON — log non-JSON stderr-like output for debugging
        if (!trimmed.startsWith("{")) {
          agentLog.push({
            ts: Date.now(),
            type: "status",
            content: `[stdout] ${trimmed.slice(0, 200)}`,
          });
          flushAgentLog(listingId, agentLog).catch(() => {});
        }
      }
    }

    agentLog.push({
      ts: Date.now(),
      type: "status",
      content: "Running Claude agent in sandbox...",
    });
    await flushAgentLog(listingId, agentLog);

    const proc = await sandbox.commands.run(
      `bash ${SANDBOX_DIR}/run-agent.sh`,
      {
        cwd: SANDBOX_DIR,
        onStdout: (data) => {
          onStdoutCallCount++;
          stdoutBuffer += data;
          const lines = stdoutBuffer.split("\n");
          stdoutBuffer = lines.pop() ?? "";
          for (const line of lines) {
            processLine(line);
          }
        },
        onStderr: (data) => {
          stderrChunks.push(data);
          agentLog.push({
            ts: Date.now(),
            type: "status",
            content: `[stderr] ${data.trim().slice(0, 300)}`,
          });
          flushAgentLog(listingId, agentLog).catch(() => {});
        },
        timeoutMs: COMMAND_TIMEOUT_MS,
      },
    );

    if (stdoutBuffer.trim()) {
      processLine(stdoutBuffer);
    }

    const stderr = stderrChunks.join("");
    agentLog.push({
      ts: Date.now(),
      type: "status",
      content: [
        `CLI exited code=${proc.exitCode}`,
        `onStdout called ${onStdoutCallCount}x`,
        `transcript lines=${rawTranscript.length}`,
        `proc.stdout length=${proc.stdout.length}`,
        `stderr length=${stderr.length}`,
        stderr.length > 0 ? `stderr tail: ${stderr.slice(-300)}` : "",
      ].filter(Boolean).join(", "),
    });
    await flushAgentLog(listingId, agentLog);

    if (onStdoutCallCount === 0 && proc.stdout.length > 0) {
      for (const line of proc.stdout.split("\n")) {
        processLine(line);
      }
    }

    if (proc.exitCode !== 0 || hasError) {
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
