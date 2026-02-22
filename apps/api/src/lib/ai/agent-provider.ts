import type { AgentLogEntry } from "@listwell/shared";
import type { ListingAgentOutput } from "@listwell/shared";

// --- Provider Interface ---

export type AgentProgressCallback = (entry: AgentLogEntry) => void;

export interface AgentImage {
  filename: string;
  buffer: Buffer;
  mimeType: string;
}

export interface AgentProviderInput {
  images: AgentImage[];
  userDescription: string | null;
  onProgress: AgentProgressCallback;
}

export interface AgentProviderResult {
  output: ListingAgentOutput;
  costUsd: number;
  transcriptLines: string[];
}

export interface AgentProvider {
  readonly name: string;
  run(input: AgentProviderInput): Promise<AgentProviderResult>;
}

// --- Factory ---

export type AgentProviderName = "e2b" | "daytona" | "anthropic-api";

let cachedProvider: AgentProvider | null = null;
let cachedProviderName: AgentProviderName | null = null;

function getProviderName(): AgentProviderName {
  const env = process.env.AGENT_PROVIDER;
  if (env === "anthropic-api") return "anthropic-api";
  if (env === "daytona") return "daytona";
  return "e2b";
}

async function createProvider(name: AgentProviderName): Promise<AgentProvider> {
  switch (name) {
    case "e2b": {
      const { createE2BProvider } = await import("./providers/e2b");
      return createE2BProvider();
    }
    case "daytona": {
      const { createDaytonaProvider } = await import("./providers/daytona");
      return createDaytonaProvider();
    }
    case "anthropic-api": {
      const { createAnthropicApiProvider } = await import(
        "./providers/anthropic-api"
      );
      return createAnthropicApiProvider();
    }
  }
}

export async function getAgentProvider(): Promise<AgentProvider> {
  const name = getProviderName();
  if (cachedProvider && cachedProviderName === name) {
    return cachedProvider;
  }

  cachedProvider = await createProvider(name);
  cachedProviderName = name;
  return cachedProvider;
}

export function _resetAgentProviderCache(): void {
  cachedProvider = null;
  cachedProviderName = null;
}
