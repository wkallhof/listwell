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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { apiFetch } from "@/lib/api";
import ListingsPage from "../page";

const mockListingsResponse = {
  data: [
    {
      id: "listing-1",
      title: "Vintage Couch",
      status: "READY",
      pipelineStep: "COMPLETE",
      agentCostUsd: 0.0523,
      createdAt: "2026-03-01T00:00:00Z",
      thumbnailUrl: "https://blob.example.com/thumb.jpg",
      user: { id: "user-1", name: "Alice", email: "alice@example.com" },
    },
    {
      id: "listing-2",
      title: null,
      status: "PROCESSING",
      pipelineStep: "ANALYZING",
      agentCostUsd: null,
      createdAt: "2026-03-02T00:00:00Z",
      thumbnailUrl: null,
      user: { id: "user-2", name: null, email: "bob@example.com" },
    },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

describe("ListingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render listings table with data", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(mockListingsResponse), { status: 200 }),
    );

    const page = await ListingsPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByText("Listings")).toBeInTheDocument();
    expect(screen.getByText("Vintage Couch")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("READY")).toBeInTheDocument();
    expect(screen.getByText("COMPLETE")).toBeInTheDocument();
    expect(screen.getByText("$0.0523")).toBeInTheDocument();
  });

  it("should show Untitled for listings without title", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(mockListingsResponse), { status: 200 }),
    );

    const page = await ListingsPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("should show email when user name is null", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(mockListingsResponse), { status: 200 }),
    );

    const page = await ListingsPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("should show dash for null cost", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(mockListingsResponse), { status: 200 }),
    );

    const page = await ListingsPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("should show empty state when no listings", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
        { status: 200 },
      ),
    );

    const page = await ListingsPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByText("No listings found.")).toBeInTheDocument();
  });

  it("should show error message on API failure", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Server error" }), { status: 500 }),
    );

    const page = await ListingsPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByText("Failed to load listings.")).toBeInTheDocument();
  });

  it("should pass status filter for processing tab", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
        { status: 200 },
      ),
    );

    await ListingsPage({
      searchParams: Promise.resolve({ tab: "processing" }),
    });

    expect(vi.mocked(apiFetch)).toHaveBeenCalledWith(
      expect.stringContaining("status=PROCESSING"),
    );
  });

  it("should pass hasError filter for errored tab", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
        { status: 200 },
      ),
    );

    await ListingsPage({
      searchParams: Promise.resolve({ tab: "errored" }),
    });

    expect(vi.mocked(apiFetch)).toHaveBeenCalledWith(
      expect.stringContaining("hasError=true"),
    );
  });

  it("should pass search param to API", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }),
        { status: 200 },
      ),
    );

    await ListingsPage({
      searchParams: Promise.resolve({ search: "couch" }),
    });

    expect(vi.mocked(apiFetch)).toHaveBeenCalledWith(
      expect.stringContaining("search=couch"),
    );
  });

  it("should include links to listing detail and user pages", async () => {
    vi.mocked(apiFetch).mockResolvedValue(
      new Response(JSON.stringify(mockListingsResponse), { status: 200 }),
    );

    const page = await ListingsPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    const listingLink = screen.getByRole("link", { name: "Vintage Couch" });
    expect(listingLink).toHaveAttribute("href", "/listings/listing-1");

    const userLink = screen.getByRole("link", { name: "Alice" });
    expect(userLink).toHaveAttribute("href", "/users/user-1");
  });
});
