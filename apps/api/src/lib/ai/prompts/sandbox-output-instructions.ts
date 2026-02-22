import { LISTING_OUTPUT_SCHEMA } from "./listing-instructions";

/**
 * Output instructions for sandbox-based providers (E2B, Daytona).
 * Tells the agent to write JSON to a file using the Write tool.
 */
export function buildSandboxOutputInstructions(outputDir: string): string {
  return `## Output Format

CRITICAL: When you have completed your analysis, research, and listing generation, you MUST write the final output to \`${outputDir}/listing-output.json\` using the Write tool. Use the FULL ABSOLUTE path shown here. This is your LAST action.

The JSON must conform to this exact schema:

\`\`\`json
${LISTING_OUTPUT_SCHEMA}
\`\`\`

Do NOT output the JSON to the conversation. You MUST use the Write tool to write it to \`${outputDir}/listing-output.json\` (absolute path). This is essential for the system to process your results.`;
}
