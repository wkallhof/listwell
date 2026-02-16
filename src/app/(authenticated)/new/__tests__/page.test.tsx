import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockPush = vi.fn();
const mockUseNewListing = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock("@/lib/new-listing-context", () => ({
  useNewListing: () => mockUseNewListing(),
}));

vi.mock("@/components/image-grid", () => ({
  ImageGrid: ({ previewUrls }: { previewUrls: string[] }) => (
    <div data-testid="image-grid">
      {previewUrls.length} photos
    </div>
  ),
}));

vi.mock("@/components/bottom-bar", () => ({
  BottomBar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bottom-bar">{children}</div>
  ),
}));

import CapturePage from "@/app/(authenticated)/new/page";

describe("CapturePage", () => {
  it("renders header and image grid", () => {
    mockUseNewListing.mockReturnValue({
      photos: [],
      previewUrls: [],
      addPhotos: vi.fn(),
      removePhoto: vi.fn(),
    });

    render(<CapturePage />);

    expect(screen.getByText("Add Photos")).toBeInTheDocument();
    expect(screen.getByTestId("image-grid")).toBeInTheDocument();
  });

  it("disables Next button when no photos", () => {
    mockUseNewListing.mockReturnValue({
      photos: [],
      previewUrls: [],
      addPhotos: vi.fn(),
      removePhoto: vi.fn(),
    });

    render(<CapturePage />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();
  });

  it("shows photo count on Next button when photos exist", () => {
    mockUseNewListing.mockReturnValue({
      photos: [new File([""], "a.jpg"), new File([""], "b.jpg")],
      previewUrls: ["blob:1", "blob:2"],
      addPhotos: vi.fn(),
      removePhoto: vi.fn(),
    });

    render(<CapturePage />);

    expect(screen.getByText("Next — 2 photos")).toBeInTheDocument();
  });

  it("navigates to describe page on Next click", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();

    mockUseNewListing.mockReturnValue({
      photos: [new File([""], "a.jpg")],
      previewUrls: ["blob:1"],
      addPhotos: vi.fn(),
      removePhoto: vi.fn(),
    });

    render(<CapturePage />);

    await user.click(screen.getByText("Next — 1 photo"));
    expect(mockPush).toHaveBeenCalledWith("/new/describe");
  });
});
