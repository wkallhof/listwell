import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
const mockParams = { id: "listing-1" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/image-carousel", () => ({
  ImageCarousel: ({ images }: { images: unknown[] }) => (
    <div data-testid="image-carousel">{images.length} images</div>
  ),
}));

vi.mock("@/components/listing-status-badge", () => ({
  ListingStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

vi.mock("@/components/copy-button", () => ({
  CopyButton: ({ label }: { label?: string }) => (
    <button data-testid={`copy-${label}`}>Copy</button>
  ),
}));

vi.mock("@/components/bottom-bar", () => ({
  BottomBar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bottom-bar">{children}</div>
  ),
}));

const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.defineProperty(navigator, "clipboard", {
  value: mockClipboard,
  writable: true,
  configurable: true,
});

import ListingDetailPage from "@/app/(authenticated)/listings/[id]/page";
import { toast } from "sonner";

const mockListing = {
  id: "listing-1",
  title: "Vintage Camera",
  description: "A great camera from the 1980s.",
  suggestedPrice: 150,
  priceRangeLow: 100,
  priceRangeHigh: 200,
  category: "Electronics",
  condition: "Good",
  brand: "Nikon",
  model: "F3",
  researchNotes: "Popular among collectors.",
  comparables: [
    { title: "Similar Camera", price: 140, source: "eBay", url: "https://ebay.com/123" },
  ],
  status: "READY",
  pipelineStep: "COMPLETE",
  pipelineError: null,
  createdAt: new Date().toISOString(),
  images: [
    { id: "img-1", blobUrl: "https://blob.test/img1.jpg", type: "ORIGINAL", sortOrder: 0, isPrimary: true },
  ],
};

// Helper: returns a fresh Response each call so body is never "already read"
function mockFetchWith(data: unknown, status = 200) {
  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
    () => Promise.resolve(new Response(JSON.stringify(data), { status })),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe("ListingDetailPage", () => {
  it("shows loading skeleton initially", () => {
    mockFetchWith(mockListing);
    render(<ListingDetailPage />);

    // Skeleton is shown before data loads
    expect(
      document.querySelector("[class*='skeleton']") ||
        document.querySelector("header"),
    ).toBeTruthy();
  });

  it("renders listing details after loading", async () => {
    mockFetchWith(mockListing);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Camera")).toBeInTheDocument();
    });

    expect(screen.getByText("$150")).toBeInTheDocument();
    expect(
      screen.getByText("A great camera from the 1980s."),
    ).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Popular among collectors.")).toBeInTheDocument();
  });

  it("renders product details", async () => {
    mockFetchWith(mockListing);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Nikon")).toBeInTheDocument();
    });

    expect(screen.getByText("F3")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("renders comparable listings", async () => {
    mockFetchWith(mockListing);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Market Comparables")).toBeInTheDocument();
    });

    expect(screen.getByText("Similar Camera")).toBeInTheDocument();
    expect(screen.getByText("$140")).toBeInTheDocument();
    expect(screen.getByText("eBay")).toBeInTheDocument();
  });

  it("renders market range", async () => {
    mockFetchWith(mockListing);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Market range: \$100 – \$200/),
      ).toBeInTheDocument();
    });
  });

  it("copies full listing on button click", async () => {
    const user = userEvent.setup();
    mockFetchWith(mockListing);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Copy Full Listing")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Copy Full Listing"));

    // The handler calls navigator.clipboard.writeText and shows a toast
    expect(toast.success).toHaveBeenCalledWith("Listing copied to clipboard");
  });

  it("shows delete confirmation dialog", async () => {
    const user = userEvent.setup();
    mockFetchWith(mockListing);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Camera")).toBeInTheDocument();
    });

    // Click the more vertical button (second button in header)
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByText("Delete Listing")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Delete Listing"));

    await waitFor(() => {
      expect(screen.getByText("Delete this listing?")).toBeInTheDocument();
    });
  });

  it("deletes listing on confirm", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (_url: string, options?: RequestInit) => {
        if (options?.method === "DELETE") {
          return Promise.resolve(new Response(null, { status: 200 }));
        }
        return Promise.resolve(
          new Response(JSON.stringify(mockListing), { status: 200 }),
        );
      },
    );

    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Camera")).toBeInTheDocument();
    });

    // Open dropdown → click Delete Listing
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByText("Delete Listing")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Delete Listing"));

    await waitFor(() => {
      expect(screen.getByText("Delete this listing?")).toBeInTheDocument();
    });

    // Click the dialog's Delete button
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith("Listing deleted");
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("navigates to feed on back button", async () => {
    const user = userEvent.setup();
    mockFetchWith(mockListing);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Camera")).toBeInTheDocument();
    });

    // The first button is the back button
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("redirects to feed on fetch error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => Promise.resolve(new Response(null, { status: 404 })),
    );

    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load listing");
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows Mark as Listed for READY status", async () => {
    const user = userEvent.setup();
    mockFetchWith(mockListing);
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Camera")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByText("Mark as Listed")).toBeInTheDocument();
    });
  });

  it("shows Mark as Sold for LISTED status", async () => {
    const user = userEvent.setup();
    mockFetchWith({ ...mockListing, status: "LISTED" });
    render(<ListingDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Vintage Camera")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByText("Mark as Sold")).toBeInTheDocument();
    });
  });
});
