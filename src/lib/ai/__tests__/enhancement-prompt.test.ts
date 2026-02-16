import { describe, expect, it } from "vitest";

import { buildEnhancementPrompt } from "../enhancement-prompt";

describe("buildEnhancementPrompt", () => {
  it("generates a base prompt without category", () => {
    const prompt = buildEnhancementPrompt({});
    expect(prompt).toContain("Enhance this product photo");
    expect(prompt).toContain("Improve lighting");
    expect(prompt).toContain("NEVER remove or hide defects");
    expect(prompt).toContain("item category is unknown");
  });

  it("includes item title when provided", () => {
    const prompt = buildEnhancementPrompt({
      title: "DeWalt 20V Cordless Drill",
    });
    expect(prompt).toContain("The item is: DeWalt 20V Cordless Drill.");
  });

  it("includes condition when provided", () => {
    const prompt = buildEnhancementPrompt({
      condition: "Good",
    });
    expect(prompt).toContain('condition as "Good"');
  });

  it("includes furniture-specific guidance", () => {
    const prompt = buildEnhancementPrompt({ category: "Furniture" });
    expect(prompt).toContain("Category-specific guidance (Furniture)");
    expect(prompt).toContain("scale reference");
    expect(prompt).toContain("Do not crop out context");
  });

  it("includes electronics-specific guidance", () => {
    const prompt = buildEnhancementPrompt({ category: "Electronics" });
    expect(prompt).toContain("Category-specific guidance (Electronics)");
    expect(prompt).toContain("screen content readable");
    expect(prompt).toContain("ports, buttons, and labels");
  });

  it("includes tools-specific guidance", () => {
    const prompt = buildEnhancementPrompt({ category: "Tools" });
    expect(prompt).toContain("Category-specific guidance (Tools)");
    expect(prompt).toContain("functional surfaces");
    expect(prompt).toContain("blades, drill bits");
  });

  it("includes clothing-specific guidance", () => {
    const prompt = buildEnhancementPrompt({ category: "Clothing" });
    expect(prompt).toContain("Category-specific guidance (Clothing)");
    expect(prompt).toContain("Wrinkles are expected");
    expect(prompt).toContain("fabric");
  });

  it("includes kids and baby items-specific guidance", () => {
    const prompt = buildEnhancementPrompt({
      category: "Kids & Baby Items",
    });
    expect(prompt).toContain("Category-specific guidance (Kids & Baby Items)");
    expect(prompt).toContain("safety labels");
  });

  it("handles case-insensitive category matching", () => {
    const prompt = buildEnhancementPrompt({ category: "FURNITURE" });
    expect(prompt).toContain("Category-specific guidance (FURNITURE)");
    expect(prompt).toContain("scale reference");
  });

  it("returns no category guidance for unknown categories", () => {
    const prompt = buildEnhancementPrompt({ category: "Vehicles" });
    expect(prompt).not.toContain("Category-specific guidance");
  });

  it("always includes core enhancement rules", () => {
    const prompt = buildEnhancementPrompt({
      category: "Electronics",
      condition: "Like New",
      title: "Sony WH-1000XM5",
    });
    expect(prompt).toContain("Improve lighting");
    expect(prompt).toContain("Reduce background clutter");
    expect(prompt).toContain("Maintain authenticity");
    expect(prompt).toContain("Preserve the item's true color");
    expect(prompt).toContain("NEVER change the item's color");
    expect(prompt).toContain("NEVER add props");
  });
});
