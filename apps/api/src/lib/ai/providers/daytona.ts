import type {
  AgentProvider,
  AgentProviderInput,
  AgentProviderResult,
} from "../agent-provider";

export function createDaytonaProvider(): AgentProvider {
  return {
    name: "daytona",

    async run(_input: AgentProviderInput): Promise<AgentProviderResult> {
      throw new Error(
        "Daytona agent provider is not yet implemented. Set AGENT_PROVIDER=e2b or AGENT_PROVIDER=anthropic-api.",
      );
    },
  };
}
