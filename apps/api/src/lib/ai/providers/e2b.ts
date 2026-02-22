import { Sandbox } from "e2b";

import type {
  AgentProvider,
  AgentProviderInput,
  AgentProviderResult,
} from "../agent-provider";
import { parseAgentOutput, extractLogEntries } from "../parse-agent-output";
import type { ContentBlock } from "../parse-agent-output";
import { buildListingInstructions } from "../prompts/listing-instructions";
import { buildSandboxOutputInstructions } from "../prompts/sandbox-output-instructions";

const SANDBOX_DIR = "/home/user";
const OUTPUT_FILENAME = "listing-output.json";
const COMMAND_TIMEOUT_MS = 270_000;
const SANDBOX_TIMEOUT_MS = 330_000;

function buildSystemPrompt(): string {
  const instructions = buildListingInstructions();
  const outputInstructions = buildSandboxOutputInstructions(SANDBOX_DIR);
  return `${instructions}\n\n## Image Analysis (CRITICAL)

The item photos have been downloaded and saved as local files in the sandbox. You MUST use the Read tool to view each image file before proceeding. The images are your primary source of information — the entire purpose of this tool is to turn photos into listings.

If you cannot read any image file (the Read tool returns an error), STOP immediately and report the error. Do NOT proceed with generating a listing based solely on the text description. A listing without image analysis is not acceptable.

${outputInstructions}`;
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

export function createE2BProvider(): AgentProvider {
  return {
    name: "e2b",

    async run(input: AgentProviderInput): Promise<AgentProviderResult> {
      const { images, userDescription, onProgress } = input;

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
        const versionResult = await sandbox.commands.run(
          "claude --version 2>&1",
          { timeoutMs: 30_000 },
        );
        const cliVersion = (
          versionResult.stdout || versionResult.stderr
        ).trim();
        onProgress({
          ts: Date.now(),
          type: "status",
          content: `CLI version: ${cliVersion} (exit ${versionResult.exitCode})`,
        });

        if (versionResult.exitCode !== 0) {
          throw new Error(`Claude CLI unavailable in sandbox: ${cliVersion}`);
        }

        const envResult = await sandbox.commands.run(
          'test -n "$ANTHROPIC_API_KEY" && echo "ok" || echo "missing"',
          { timeoutMs: 10_000 },
        );
        if (envResult.stdout.trim() !== "ok") {
          throw new Error(
            "ANTHROPIC_API_KEY not set in sandbox environment",
          );
        }

        // --- Write files to sandbox ---
        const systemPrompt = buildSystemPrompt();
        const localImagePaths = images.map(
          (img) => `${SANDBOX_DIR}/images/${img.filename}`,
        );
        const userPrompt = buildUserPrompt(localImagePaths, userDescription);

        await sandbox.files.write(`${SANDBOX_DIR}/CLAUDE.md`, systemPrompt);
        await sandbox.files.write(
          `${SANDBOX_DIR}/user-prompt.txt`,
          userPrompt,
        );
        for (const img of images) {
          const bytes = Uint8Array.from(img.buffer);
          await sandbox.files.write(
            `${SANDBOX_DIR}/images/${img.filename}`,
            bytes.buffer as ArrayBuffer,
          );
        }

        // Verify files landed correctly
        const fileCheck = await sandbox.commands.run(
          `ls -la ${SANDBOX_DIR}/CLAUDE.md ${SANDBOX_DIR}/user-prompt.txt ${SANDBOX_DIR}/images/ 2>&1`,
          { timeoutMs: 10_000 },
        );
        onProgress({
          ts: Date.now(),
          type: "status",
          content: `Sandbox files: ${fileCheck.stdout.trim().slice(0, 300)}`,
        });

        // --- Network connectivity check ---
        const netCheck = await sandbox.commands.run(
          'curl -s -m 10 -o /dev/null -w "%{http_code}" https://api.anthropic.com/v1/messages 2>&1',
          { timeoutMs: 15_000 },
        );
        onProgress({
          ts: Date.now(),
          type: "status",
          content: `Anthropic API reachability: HTTP ${netCheck.stdout.trim()} (exit ${netCheck.exitCode})`,
        });

        // --- Smoke test ---
        onProgress({
          ts: Date.now(),
          type: "status",
          content:
            "Smoke test: verifying Claude CLI can reach Anthropic API...",
        });

        const smokeTest = await sandbox.commands.run(
          'claude -p "Reply with only the word OK" --dangerously-skip-permissions --output-format json --max-turns 1 2>&1',
          { timeoutMs: 60_000 },
        );
        onProgress({
          ts: Date.now(),
          type: "status",
          content: `Smoke test: exit=${smokeTest.exitCode}, stdout=${smokeTest.stdout.trim().slice(0, 300)}`,
        });

        if (smokeTest.exitCode !== 0) {
          throw new Error(
            `Claude CLI smoke test failed (exit ${smokeTest.exitCode}): ${(smokeTest.stdout + smokeTest.stderr).slice(0, 500)}`,
          );
        }

        // --- Build runner script ---
        // Pipes /dev/null to stdin to prevent Claude CLI from blocking
        // on stdin during init.
        const runnerScript = [
          "#!/bin/bash",
          `PROMPT=$(cat ${SANDBOX_DIR}/user-prompt.txt)`,
          `claude -p "$PROMPT" \\`,
          "  --dangerously-skip-permissions \\",
          "  --output-format stream-json \\",
          "  --model sonnet \\",
          "  --max-turns 15 < /dev/null",
        ].join("\n");

        await sandbox.files.write(
          `${SANDBOX_DIR}/run-agent.sh`,
          runnerScript,
        );
        await sandbox.commands.run(
          `chmod +x ${SANDBOX_DIR}/run-agent.sh`,
          { timeoutMs: 5_000 },
        );

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
              for (const entry of entries) {
                onProgress(entry);
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
            if (!trimmed.startsWith("{")) {
              onProgress({
                ts: Date.now(),
                type: "status",
                content: `[stdout] ${trimmed.slice(0, 200)}`,
              });
            }
          }
        }

        onProgress({
          ts: Date.now(),
          type: "status",
          content: "Running Claude agent in sandbox...",
        });

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
              onProgress({
                ts: Date.now(),
                type: "status",
                content: `[stderr] ${data.trim().slice(0, 300)}`,
              });
            },
            timeoutMs: COMMAND_TIMEOUT_MS,
          },
        );

        if (stdoutBuffer.trim()) {
          processLine(stdoutBuffer);
        }

        const stderr = stderrChunks.join("");
        onProgress({
          ts: Date.now(),
          type: "status",
          content: [
            `CLI exited code=${proc.exitCode}`,
            `onStdout called ${onStdoutCallCount}x`,
            `transcript lines=${rawTranscript.length}`,
            `proc.stdout length=${proc.stdout.length}`,
            `stderr length=${stderr.length}`,
            stderr.length > 0 ? `stderr tail: ${stderr.slice(-300)}` : "",
          ]
            .filter(Boolean)
            .join(", "),
        });

        if (onStdoutCallCount === 0 && proc.stdout.length > 0) {
          for (const line of proc.stdout.split("\n")) {
            processLine(line);
          }
        }

        if (proc.exitCode !== 0 || hasError) {
          const detail = hasError
            ? errorMessage
            : stderr || `exit code ${proc.exitCode}`;
          throw new Error(`Claude CLI failed: ${detail}`);
        }

        // --- Read output ---
        const outputText = await sandbox.files.read(
          `${SANDBOX_DIR}/${OUTPUT_FILENAME}`,
        );

        if (!outputText) {
          throw new Error("Agent did not produce output file");
        }

        const raw = JSON.parse(outputText) as unknown;
        const output = parseAgentOutput(raw);

        return { output, costUsd: 0, transcriptLines: rawTranscript };
      } finally {
        await sandbox.kill().catch(() => {});
      }
    },
  };
}
