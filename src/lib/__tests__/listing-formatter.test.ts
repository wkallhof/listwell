// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatListingForClipboard } from "@/lib/listing-formatter";

describe("formatListingForClipboard", () => {
  it("formats title, price, and description", () => {
    const result = formatListingForClipboard({
      title: "Vintage Camera",
      suggestedPrice: 150,
      description: "Great condition Nikon camera from the 1980s.",
    });

    expect(result).toBe(
      "Vintage Camera\n$150\n\nGreat condition Nikon camera from the 1980s.",
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

    expect(result).toBe("Cool Item\n$75");
  });

  it("handles all null values", () => {
    const result = formatListingForClipboard({
      title: null,
      suggestedPrice: null,
      description: null,
    });

    expect(result).toBe("");
  });
});
