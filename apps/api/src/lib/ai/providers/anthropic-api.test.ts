// @vitest-environment node
import { describe, it, expect } from "vitest";

// Test the cost estimation logic directly
// Sonnet 4.5 pricing: $3/M input, $15/M output
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

function estimateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * INPUT_COST_PER_M +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_M
  );
}

describe("Anthropic API cost calculation", () => {
  it("calculates cost correctly for typical usage", () => {
    // 10,000 input + 2,000 output
    const cost = estimateCost(10_000, 2_000);
    // (10000/1M * 3) + (2000/1M * 15) = 0.03 + 0.03 = 0.06
    expect(cost).toBeCloseTo(0.06, 6);
  });

  it("returns 0 for zero tokens", () => {
    expect(estimateCost(0, 0)).toBe(0);
  });

  it("handles large token counts", () => {
    // 1M input + 500K output
    const cost = estimateCost(1_000_000, 500_000);
    // (1 * 3) + (0.5 * 15) = 3 + 7.5 = 10.5
    expect(cost).toBeCloseTo(10.5, 6);
  });

  it("uses correct Sonnet 4.5 pricing rates", () => {
    // Verify exact rates: $3 per million input, $15 per million output
    expect(estimateCost(1_000_000, 0)).toBe(3.0);
    expect(estimateCost(0, 1_000_000)).toBe(15.0);
  });
});
