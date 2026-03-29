import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListingStatusBadge } from "@/components/listing-status-badge";

describe("ListingStatusBadge", () => {
  const statuses = [
    { status: "DRAFT" as const, label: "Draft" },
    { status: "PROCESSING" as const, label: "Processing" },
    { status: "READY" as const, label: "Ready" },
    { status: "LISTED" as const, label: "Listed" },
    { status: "SOLD" as const, label: "Sold" },
    { status: "ARCHIVED" as const, label: "Archived" },
    { status: "ERROR" as const, label: "Error" },
  ];

  for (const { status, label } of statuses) {
    it(`renders "${label}" for status ${status}`, () => {
      render(<ListingStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  }

  it("shows spinner icon for PROCESSING status", () => {
    const { container } = render(<ListingStatusBadge status="PROCESSING" />);
    const spinnerIcon = container.querySelector(".animate-spin");
    expect(spinnerIcon).toBeInTheDocument();
  });

  it("does not show spinner for READY status", () => {
    const { container } = render(<ListingStatusBadge status="READY" />);
    const spinnerIcon = container.querySelector(".animate-spin");
    expect(spinnerIcon).not.toBeInTheDocument();
  });
});
