import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockReset = vi.fn();
const mockSetDescription = vi.fn();
const mockCreateListing = vi.fn();
const mockUploadImages = vi.fn();

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

vi.mock("@/lib/upload-client", () => ({
  uploadImages: (...args: unknown[]) => mockUploadImages(...args),
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
  mockUploadImages.mockResolvedValue([
    { key: "listings/abc/photo.jpg", url: "https://r2.test/photo.jpg", filename: "photo.jpg" },
  ]);
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

  it("uploads images then creates listing on Generate click", async () => {
    const user = userEvent.setup();
    mockCreateListing.mockResolvedValue({ success: true, listingId: "123" });

    render(<DescribePage />);

    await user.click(screen.getByText("Generate Listing"));

    // Verify upload was called first
    expect(mockUploadImages).toHaveBeenCalledWith(
      [expect.any(File)],
      expect.any(Function),
    );
    // Then listing created with image metadata
    expect(mockCreateListing).toHaveBeenCalledWith({
      description: undefined,
      images: [
        { key: "listings/abc/photo.jpg", url: "https://r2.test/photo.jpg", filename: "photo.jpg" },
      ],
    });
    expect(mockPush).toHaveBeenCalledWith("/listings/123");
  });

  it("uploads images then creates listing without description on Skip", async () => {
    const user = userEvent.setup();
    mockCreateListing.mockResolvedValue({ success: true, listingId: "123" });

    render(<DescribePage />);

    await user.click(screen.getByText("Skip"));

    expect(mockUploadImages).toHaveBeenCalled();
    expect(mockCreateListing).toHaveBeenCalledWith({
      description: undefined,
      images: expect.any(Array),
    });
    expect(mockPush).toHaveBeenCalledWith("/listings/123");
  });

  it("shows error toast on listing creation failure", async () => {
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

  it("shows upload error message on upload failure", async () => {
    const user = userEvent.setup();
    mockUploadImages.mockRejectedValue(
      new Error("Upload failed for photo.jpg. Check R2 CORS configuration."),
    );

    render(<DescribePage />);

    await user.click(screen.getByText("Generate Listing"));

    expect(toast.error).toHaveBeenCalledWith(
      "Upload failed for photo.jpg. Check R2 CORS configuration.",
    );
  });

  it("shows helper text", () => {
    render(<DescribePage />);

    expect(
      screen.getByText(/More detail = better results/),
    ).toBeInTheDocument();
  });
});
