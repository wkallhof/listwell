import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListingCard } from "@/components/listing-card";

describe("ListingCard", () => {
  const defaultProps = {
    id: "listing-1",
    title: "Vintage Camera",
    status: "READY" as const,
    suggestedPrice: 150,
    pipelineStep: null,
    createdAt: new Date().toISOString(),
    primaryImageUrl: "https://blob.test/photo.jpg",
  };

  it("renders title and price", () => {
    render(<ListingCard {...defaultProps} />);

    expect(screen.getByText("Vintage Camera")).toBeInTheDocument();
    expect(screen.getByText("$150")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<ListingCard {...defaultProps} />);

    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("links to listing detail page", () => {
    render(<ListingCard {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/listings/listing-1");
  });

  it('shows "Processing..." when status is PROCESSING', () => {
    render(
      <ListingCard
        {...defaultProps}
        status="PROCESSING"
        title={null}
        pipelineStep="ANALYZING"
        suggestedPrice={null}
      />,
    );

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByText("Analyzing photos")).toBeInTheDocument();
  });

  it("renders image when primaryImageUrl is provided", () => {
    render(<ListingCard {...defaultProps} />);

    const img = screen.getByAltText("Vintage Camera");
    expect(img).toHaveAttribute("src", "https://blob.test/photo.jpg");
  });

  it("shows time ago", () => {
    render(<ListingCard {...defaultProps} />);

    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("shows Untitled when title is null and not processing", () => {
    render(<ListingCard {...defaultProps} title={null} />);

    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("lazy loads the thumbnail image", () => {
    render(<ListingCard {...defaultProps} />);

    const img = screen.getByAltText("Vintage Camera");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });
});
