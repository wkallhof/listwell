import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  ListingQuality,
  evaluateListingQuality,
} from "../listing-quality";

const fullListing = {
  photoCount: 3,
  description:
    "I bought this drill about a year ago for a small home project and have barely used it since. It is a DeWalt 20V MAX cordless drill with two speed settings and an LED work light. Comes with the original charger and one 2.0Ah battery. There are no scratches or wear marks anywhere on the body or handle. The chuck still grips tight and the battery holds a full charge. Works perfectly every time I have used it. Retails for around one hundred and twenty nine dollars, and I am asking seventy five. Pickup available in the Riverside area. Feel free to message me with any questions or if you would like more photos.",
  suggestedPrice: 75,
  comparablesCount: 3,
  brand: "DeWalt",
  condition: "Like New",
  researchNotes: "Found 6 comparable sold listings on eBay.",
};

const emptyListing = {
  photoCount: 0,
  description: null,
  suggestedPrice: null,
  comparablesCount: 0,
  brand: null,
  condition: null,
  researchNotes: null,
};

describe("evaluateListingQuality", () => {
  it("returns all checks passed for a complete listing", () => {
    const { checks, score, total } = evaluateListingQuality(fullListing);
    expect(score).toBe(6);
    expect(total).toBe(6);
    expect(checks.every((c) => c.passed)).toBe(true);
  });

  it("returns all checks failed for an empty listing", () => {
    const { checks, score, total } = evaluateListingQuality(emptyListing);
    expect(score).toBe(0);
    expect(total).toBe(6);
    expect(checks.every((c) => !c.passed)).toBe(true);
  });

  it("requires at least 2 photos", () => {
    const result = evaluateListingQuality({ ...fullListing, photoCount: 1 });
    const photoCheck = result.checks.find((c) =>
      c.label.includes("photos"),
    );
    expect(photoCheck?.passed).toBe(false);
  });

  it("requires description of 80+ words", () => {
    const shortDesc = evaluateListingQuality({
      ...fullListing,
      description: "Short description here.",
    });
    const descCheck = shortDesc.checks.find((c) =>
      c.label.includes("Description"),
    );
    expect(descCheck?.passed).toBe(false);
  });

  it("requires both price and comparables for price research check", () => {
    const noComps = evaluateListingQuality({
      ...fullListing,
      comparablesCount: 0,
    });
    const priceCheck = noComps.checks.find((c) =>
      c.label.includes("Price"),
    );
    expect(priceCheck?.passed).toBe(false);

    const noPrice = evaluateListingQuality({
      ...fullListing,
      suggestedPrice: null,
    });
    const priceCheck2 = noPrice.checks.find((c) =>
      c.label.includes("Price"),
    );
    expect(priceCheck2?.passed).toBe(false);
  });

  it("checks brand is non-empty string", () => {
    const emptyBrand = evaluateListingQuality({
      ...fullListing,
      brand: "",
    });
    const brandCheck = emptyBrand.checks.find((c) =>
      c.label.includes("Brand"),
    );
    expect(brandCheck?.passed).toBe(false);
  });
});

describe("ListingQuality component", () => {
  it("renders score as fraction", () => {
    render(<ListingQuality {...fullListing} />);
    expect(screen.getByText("6/6")).toBeInTheDocument();
  });

  it("renders all check labels", () => {
    render(<ListingQuality {...fullListing} />);
    expect(screen.getByText("At least 2 photos")).toBeInTheDocument();
    expect(screen.getByText("Description 80+ words")).toBeInTheDocument();
    expect(screen.getByText("Price researched")).toBeInTheDocument();
    expect(screen.getByText("Brand identified")).toBeInTheDocument();
    expect(screen.getByText("Condition assessed")).toBeInTheDocument();
    expect(screen.getByText("Market notes included")).toBeInTheDocument();
  });

  it("renders heading", () => {
    render(<ListingQuality {...fullListing} />);
    expect(screen.getByText("Listing Quality")).toBeInTheDocument();
  });

  it("renders partial score for incomplete listing", () => {
    render(
      <ListingQuality
        {...emptyListing}
        photoCount={3}
        brand="TestBrand"
        condition="Good"
      />,
    );
    expect(screen.getByText("3/6")).toBeInTheDocument();
  });
});
