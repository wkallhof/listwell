// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatListingForClipboard } from "@/lib/listing-formatter";

describe("formatListingForClipboard", () => {
  it("formats title with price inline, description, and details", () => {
    const result = formatListingForClipboard({
      title: "Vintage Camera",
      suggestedPrice: 150,
      description: "Great condition Nikon camera from the 1980s.",
      condition: "Good",
      brand: "Nikon",
      model: "F3",
    });

    expect(result).toBe(
      "Vintage Camera - $150\n\nGreat condition Nikon camera from the 1980s.\n\nCondition: Good | Brand: Nikon | Model: F3",
    );
  });

  it("handles missing title", () => {
    const result = formatListingForClipboard({
      title: null,
      suggestedPrice: 50,
      description: "Nice item",
    });

    expect(result).toBe("$50\n\nNice item");
  });

  it("handles missing price", () => {
    const result = formatListingForClipboard({
      title: "Cool Item",
      suggestedPrice: null,
      description: "A description",
    });

    expect(result).toBe("Cool Item\n\nA description");
  });

  it("handles missing description", () => {
    const result = formatListingForClipboard({
      title: "Cool Item",
      suggestedPrice: 75,
      description: null,
    });

    expect(result).toBe("Cool Item - $75");
  });

  it("handles all null values", () => {
    const result = formatListingForClipboard({
      title: null,
      suggestedPrice: null,
      description: null,
    });

    expect(result).toBe("");
  });

  it("includes partial product details", () => {
    const result = formatListingForClipboard({
      title: "Widget",
      suggestedPrice: 25,
      description: null,
      brand: "Acme",
    });

    expect(result).toBe("Widget - $25\n\nBrand: Acme");
  });

  it("omits details line when no details provided", () => {
    const result = formatListingForClipboard({
      title: "Widget",
      suggestedPrice: 25,
      description: "A widget.",
      condition: null,
      brand: null,
      model: null,
    });

    expect(result).toBe("Widget - $25\n\nA widget.");
  });

  it("formats details with only condition", () => {
    const result = formatListingForClipboard({
      title: "Lamp",
      suggestedPrice: 10,
      description: null,
      condition: "Like New",
    });

    expect(result).toBe("Lamp - $10\n\nCondition: Like New");
  });
});
