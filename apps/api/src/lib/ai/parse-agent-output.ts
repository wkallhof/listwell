import type { AgentLogEntry } from "@listwell/shared";
import {
  listingAgentOutputSchema,
  type ListingAgentOutput,
} from "@listwell/shared";

export interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

const TOOL_LOG_MAP: Record<
  string,
  { type: AgentLogEntry["type"]; field: string; prefix: string }
> = {
  WebSearch: { type: "search", field: "query", prefix: "Searching" },
  WebFetch: { type: "fetch", field: "url", prefix: "Fetching" },
  Write: { type: "write", field: "", prefix: "Writing listing output" },
};

export function parseAgentOutput(raw: unknown): ListingAgentOutput {
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
      entries.push({ ts: now, type: "text", content: block.text.slice(0, 200) });
      continue;
    }

    if (block.type !== "tool_use" || !block.name) continue;

    const mapping = TOOL_LOG_MAP[block.name];
    if (!mapping) continue;

    const value =
      mapping.field && typeof block.input?.[mapping.field] === "string"
        ? (block.input[mapping.field] as string)
        : "";
    const content = value ? `${mapping.prefix}: ${value}` : mapping.prefix;

    entries.push({ ts: now, type: mapping.type, content });
  }

  return entries;
}
