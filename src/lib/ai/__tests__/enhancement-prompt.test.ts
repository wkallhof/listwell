// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildEnhancementPrompt } from "../enhancement-prompt";

describe("buildEnhancementPrompt", () => {
  it("generates base prompt without category context", () => {
    const prompt = buildEnhancementPrompt();

    expect(prompt).toContain("Edit this product photo");
    expect(prompt).toContain("authentic but improved");
    expect(prompt).toContain("Improve lighting");
    expect(prompt).toContain("Reduce background clutter");
    expect(prompt).toContain("Preserve the item's true color");
    expect(prompt).toContain("Do NOT remove or hide any defects");
    expect(prompt).toContain("Do NOT add props");
    expect(prompt).toContain("Do NOT apply heavy filters");
    expect(prompt).toContain("Return only the enhanced image");
  });

  it("includes furniture-specific notes for furniture category", () => {
    const prompt = buildEnhancementPrompt({ category: "Furniture" });

    expect(prompt).toContain("Category-specific guidance (Furniture)");
    expect(prompt).toContain("Preserve context objects that show scale");
  });

  it("includes electronics-specific notes for electronics category", () => {
    const prompt = buildEnhancementPrompt({ category: "Electronics" });

    expect(prompt).toContain("Category-specific guidance (Electronics)");
    expect(prompt).toContain("screens were on");
  });

  it("includes clothing-specific notes for clothing category", () => {
    const prompt = buildEnhancementPrompt({ category: "Clothing" });

    expect(prompt).toContain("Category-specific guidance (Clothing)");
    expect(prompt).toContain("Wrinkles are expected");
  });

  it("includes tool-specific notes for tools category", () => {
    const prompt = buildEnhancementPrompt({ category: "Tools & Hardware" });

    expect(prompt).toContain("Category-specific guidance (Tools & Hardware)");
    expect(prompt).toContain("functional surfaces");
  });

  it("matches electronics for various category names", () => {
    const cases = ["Computer", "Phone", "TV", "Audio Equipment"];
    for (const category of cases) {
      const prompt = buildEnhancementPrompt({ category });
      expect(prompt).toContain("screens were on");
    }
  });

  it("omits category section for unknown categories", () => {
    const prompt = buildEnhancementPrompt({ category: "Collectibles" });

    expect(prompt).not.toContain("Category-specific guidance");
  });

  it("omits category section for null category", () => {
    const prompt = buildEnhancementPrompt({ category: null });

    expect(prompt).not.toContain("Category-specific guidance");
  });

  it("handles empty input", () => {
    const prompt = buildEnhancementPrompt({});

    expect(prompt).toContain("Edit this product photo");
    expect(prompt).not.toContain("Category-specific guidance");
  });
});
