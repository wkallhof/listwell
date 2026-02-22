import { LISTING_OUTPUT_SCHEMA } from "./listing-instructions";

/**
 * Output instructions for direct API providers (Anthropic API).
 * Tells the model to return JSON as the final text block in its response.
 */
export function buildDirectApiOutputInstructions(): string {
  return `## Output Format

CRITICAL: After completing your analysis, research, and listing generation, your FINAL message must contain ONLY a valid JSON object (no markdown fences, no extra text). This JSON is parsed programmatically.

The JSON must conform to this exact schema:

${LISTING_OUTPUT_SCHEMA}

Return ONLY the JSON object as your final response. Do not wrap it in markdown code fences. Do not include any text before or after the JSON.`;
}
