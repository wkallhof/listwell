import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const notFoundError = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw notFoundError;
  }),
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import ListingDetailPage from "../[id]/page";

const baseListing = {
  id: "listing-1",
  userId: "user-1",
  rawDescription: "vintage couch, good condition",
  title: "Vintage Leather Couch",
  description: "A beautiful vintage leather couch in excellent condition.",
  suggestedPrice: 250,
  priceRangeLow: 200,
  priceRangeHigh: 350,
  category: "Furniture",
  condition: "Good",
  brand: "West Elm",
  model: null,
  researchNotes: "Similar couches sell for $200-$350 on Facebook Marketplace.",
  comparables: [
    { title: "Similar Leather Couch", price: 275, source: "eBay", condition: "Good" },
    { title: "Vintage Sofa", price: 300, source: "Craigslist", url: "https://example.com" },
  ],
  status: "READY",
  pipelineStep: "COMPLETE",
  pipelineError: null,
  agentLog: [
    { ts: 1709300000, type: "status", content: "Analyzing images..." },
    { ts: 1709300025, type: "complete", content: "Done" },
  ],
  agentTranscriptUrl: "https://example.com/transcript",
  agentCostUsd: 0.0523,
  agentInputTokens: 1200,
  agentOutputTokens: 800,
  agentProvider: "anthropic-api",
  inngestRunId: "run-123",
  createdAt: "2026-03-01T00:00:00Z",
  updatedAt: "2026-03-01T00:00:00Z",
  images: [
    {
      id: "img-1",
      type: "ORIGINAL",
      blobUrl: "https://blob.example.com/img.jpg",
      sortOrder: 0,
      isPrimary: true,
    },
    {
      id: "img-2",
      type: "ENHANCED",
      blobUrl: "https://blob.example.com/enhanced.jpg",
      sortOrder: 1,
      isPrimary: false,
    },
  ],
  user: { id: "user-1", name: "Alice", email: "alice@example.com" },
  creditTransaction: { id: "txn-1", type: "USAGE", amount: -1, balanceAfter: 4, createdAt: "2026-03-01" },
};

describe("ListingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call notFound on API error", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    );

    await expect(
      ListingDetailPage({ params: Promise.resolve({ id: "nonexistent" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("should render listing title and status badges", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText("Vintage Leather Couch")).toBeInTheDocument();
    expect(screen.getByText("READY")).toBeInTheDocument();
    expect(screen.getByText("COMPLETE")).toBeInTheDocument();
  });

  it("should render images section with counts", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText("Images")).toBeInTheDocument();
    expect(screen.getByText("1 original, 1 enhanced")).toBeInTheDocument();
  });

  it("should render description and raw description", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText(/beautiful vintage leather couch/)).toBeInTheDocument();
    expect(screen.getByText("vintage couch, good condition")).toBeInTheDocument();
  });

  it("should render pricing details", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText("$250.00")).toBeInTheDocument();
    expect(screen.getByText("$200.00 – $350.00")).toBeInTheDocument();
    expect(screen.getByText("Furniture")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("West Elm")).toBeInTheDocument();
  });

  it("should render comparable listings", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText("Comparable Listings")).toBeInTheDocument();
    expect(screen.getByText("Similar Leather Couch")).toBeInTheDocument();
    expect(screen.getByText("$275.00")).toBeInTheDocument();
  });

  it("should render research notes", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText("Research Notes")).toBeInTheDocument();
    expect(screen.getByText(/Similar couches sell/)).toBeInTheDocument();
  });

  it("should render admin details section", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText("Admin Details")).toBeInTheDocument();
    expect(screen.getByText("$0.0523")).toBeInTheDocument();
    expect(screen.getByText("1,200 in / 800 out tokens")).toBeInTheDocument();
    expect(screen.getByText("anthropic-api")).toBeInTheDocument();
    expect(screen.getByText("USAGE (-1)")).toBeInTheDocument();
  });

  it("should render user link in admin section", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    const userLink = screen.getByRole("link", { name: "Alice" });
    expect(userLink).toHaveAttribute("href", "/users/user-1");
  });

  it("should render agent log", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText("Agent Log")).toBeInTheDocument();
    expect(screen.getByText("2 entries")).toBeInTheDocument();
    expect(screen.getByText("Analyzing images...")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("should render transcript link", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    const links = screen.getAllByText(/agent transcript/i);
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("should render pipeline error section for errored listings", async () => {
    const erroredListing = {
      ...baseListing,
      status: "PROCESSING",
      pipelineStep: "ERROR",
      pipelineError: "Agent sandbox timed out after 120 seconds",
      creditTransaction: { id: "txn-2", type: "REFUND", amount: 1, balanceAfter: 5, createdAt: "2026-03-01" },
    };

    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(erroredListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText("Pipeline Error")).toBeInTheDocument();
    expect(screen.getByText("Agent sandbox timed out after 120 seconds")).toBeInTheDocument();
    expect(screen.getByText(/Credit refunded/)).toBeInTheDocument();
  });

  it("should not show error section when pipeline is not in error state", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(baseListing), { status: 200 }),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.queryByText("Pipeline Error")).not.toBeInTheDocument();
  });

  it("should show Untitled for null title", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(
        JSON.stringify({ ...baseListing, title: null }),
        { status: 200 },
      ),
    );

    const page = await ListingDetailPage({ params: Promise.resolve({ id: "listing-1" }) });
    render(page);

    expect(screen.getByText("Untitled Listing")).toBeInTheDocument();
  });
});
