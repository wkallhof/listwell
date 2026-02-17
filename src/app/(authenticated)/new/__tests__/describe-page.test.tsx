import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockReset = vi.fn();
const mockSetDescription = vi.fn();
const mockCreateListing = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/new-listing-context", () => ({
  useNewListing: () => ({
    photos: [new File(["x"], "photo.jpg", { type: "image/jpeg" })],
    previewUrls: ["blob:http://localhost/photo1"],
    description: "",
    setDescription: mockSetDescription,
    reset: mockReset,
  }),
}));

vi.mock("@/lib/listing-actions", () => ({
  createListing: (...args: unknown[]) => mockCreateListing(...args),
}));

vi.mock("@/components/bottom-bar", () => ({
  BottomBar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bottom-bar">{children}</div>
  ),
}));

import DescribePage from "@/app/(authenticated)/new/describe/page";
import { toast } from "sonner";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DescribePage", () => {
  it("renders header, thumbnail strip, and textarea", () => {
    render(<DescribePage />);

    expect(screen.getByText("Describe It")).toBeInTheDocument();
    expect(screen.getByAltText("Photo 1")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Tell us about this item/),
    ).toBeInTheDocument();
  });

  it("renders Skip and Generate Listing buttons", () => {
    render(<DescribePage />);

    expect(screen.getByText("Skip")).toBeInTheDocument();
    expect(screen.getByText("Generate Listing")).toBeInTheDocument();
  });

  it("calls createListing on Generate Listing click", async () => {
    const user = userEvent.setup();
    mockCreateListing.mockResolvedValue({ success: true, listingId: "123" });

    render(<DescribePage />);

    await user.click(screen.getByText("Generate Listing"));

    expect(mockCreateListing).toHaveBeenCalledWith(expect.any(FormData));
    expect(mockReset).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/listings/123");
  });

  it("calls createListing without description on Skip click", async () => {
    const user = userEvent.setup();
    mockCreateListing.mockResolvedValue({ success: true, listingId: "123" });

    render(<DescribePage />);

    await user.click(screen.getByText("Skip"));

    expect(mockCreateListing).toHaveBeenCalledWith(expect.any(FormData));
    expect(mockPush).toHaveBeenCalledWith("/listings/123");
  });

  it("shows error toast on failure", async () => {
    const user = userEvent.setup();
    mockCreateListing.mockResolvedValue({
      success: false,
      error: "Upload failed",
    });

    render(<DescribePage />);

    await user.click(screen.getByText("Generate Listing"));

    expect(toast.error).toHaveBeenCalledWith("Upload failed");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows generic error on unexpected failure", async () => {
    const user = userEvent.setup();
    mockCreateListing.mockRejectedValue(new Error("Network error"));

    render(<DescribePage />);

    await user.click(screen.getByText("Generate Listing"));

    expect(toast.error).toHaveBeenCalledWith("An unexpected error occurred");
  });

  it("shows helper text", () => {
    render(<DescribePage />);

    expect(
      screen.getByText(/More detail = better results/),
    ).toBeInTheDocument();
  });
});
