import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ImageEnhancementSheet } from "@/components/image-enhancement-sheet";

// Mock sonner toast - capture callbacks
let lastToastInfoCall: {
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
} = {};

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn((_msg: string, opts?: Record<string, unknown>) => {
      lastToastInfoCall = opts as typeof lastToastInfoCall;
    }),
  },
}));

describe("ImageEnhancementSheet", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    listingId: "listing-1",
    imageId: "img-1",
    originalUrl: "https://blob.test/original.jpg",
    variants: [] as { id: string; blobUrl: string }[],
    onVariantsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    lastToastInfoCall = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders sheet with title and description", () => {
    render(<ImageEnhancementSheet {...defaultProps} />);

    expect(screen.getByText("Enhance Photo")).toBeInTheDocument();
    expect(
      screen.getByText("AI will clean up lighting and background"),
    ).toBeInTheDocument();
  });

  it("renders original image with label", () => {
    render(<ImageEnhancementSheet {...defaultProps} />);

    const images = document.querySelectorAll("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Original")).toBeInTheDocument();
  });

  it("renders enhance button when not enhancing", () => {
    render(<ImageEnhancementSheet {...defaultProps} />);

    expect(
      screen.getByText("Generate Enhanced Version"),
    ).toBeInTheDocument();
  });

  it("renders Done button in footer", () => {
    render(<ImageEnhancementSheet {...defaultProps} />);

    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Done is clicked", () => {
    render(<ImageEnhancementSheet {...defaultProps} />);

    fireEvent.click(screen.getByText("Done"));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders enhanced variants when provided", () => {
    const variants = [
      { id: "v1", blobUrl: "https://blob.test/enhanced1.jpg" },
      { id: "v2", blobUrl: "https://blob.test/enhanced2.jpg" },
    ];

    render(
      <ImageEnhancementSheet {...defaultProps} variants={variants} />,
    );

    expect(screen.getByText("Enhanced versions")).toBeInTheDocument();
    const deleteButtons = screen.getAllByLabelText("Delete enhanced variant");
    expect(deleteButtons).toHaveLength(2);
  });

  it("does not render variants section when none exist", () => {
    render(<ImageEnhancementSheet {...defaultProps} />);

    expect(screen.queryByText("Enhanced versions")).not.toBeInTheDocument();
  });

  it("shows enhancing state and starts polling when enhance is clicked", async () => {
    vi.useRealTimers();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "processing" }),
    }) as unknown as typeof fetch;

    render(<ImageEnhancementSheet {...defaultProps} />);

    fireEvent.click(screen.getByText("Generate Enhanced Version"));

    await waitFor(() => {
      expect(screen.getByText("Enhancing...")).toBeInTheDocument();
    });

    // Enhance button should be hidden while enhancing
    expect(
      screen.queryByText("Generate Enhanced Version"),
    ).not.toBeInTheDocument();
  });

  it("shows error toast when enhancement request fails", async () => {
    vi.useRealTimers();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    }) as unknown as typeof fetch;

    const { toast } = await import("sonner");

    render(<ImageEnhancementSheet {...defaultProps} />);

    fireEvent.click(screen.getByText("Generate Enhanced Version"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Enhancement failed — try again",
      );
    });
  });

  it("calls onVariantsChange optimistically when delete is clicked", async () => {
    vi.useRealTimers();
    const variants = [
      { id: "v1", blobUrl: "https://blob.test/enhanced1.jpg" },
    ];
    const onVariantsChange = vi.fn();
    const { toast } = await import("sonner");

    render(
      <ImageEnhancementSheet
        {...defaultProps}
        variants={variants}
        onVariantsChange={onVariantsChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Delete enhanced variant"));

    // Optimistic removal
    expect(onVariantsChange).toHaveBeenCalledWith([]);

    // Toast shown with undo
    expect(toast.info).toHaveBeenCalledWith(
      "Image deleted",
      expect.objectContaining({
        duration: 5000,
        action: expect.objectContaining({ label: "Undo" }),
      }),
    );
  });

  it("restores variant when undo is clicked in toast", async () => {
    vi.useRealTimers();
    const variants = [
      { id: "v1", blobUrl: "https://blob.test/enhanced1.jpg" },
    ];
    const onVariantsChange = vi.fn();

    render(
      <ImageEnhancementSheet
        {...defaultProps}
        variants={variants}
        onVariantsChange={onVariantsChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Delete enhanced variant"));

    // Simulate clicking undo in the toast
    if (lastToastInfoCall.action?.onClick) {
      lastToastInfoCall.action.onClick();
    }

    // Should restore the original variants
    expect(onVariantsChange).toHaveBeenCalledWith(variants);
  });

  it("sends delete request on toast dismiss when not undone", async () => {
    vi.useRealTimers();
    const variants = [
      { id: "v1", blobUrl: "https://blob.test/enhanced1.jpg" },
    ];
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(
      <ImageEnhancementSheet
        {...defaultProps}
        variants={variants}
      />,
    );

    fireEvent.click(screen.getByLabelText("Delete enhanced variant"));

    // Simulate toast being dismissed without undo
    if (lastToastInfoCall.onDismiss) {
      await lastToastInfoCall.onDismiss();
    }

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/listings/listing-1/images",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ imageId: "v1" }),
      }),
    );
  });

  it("does not send delete request if undo was clicked before dismiss", async () => {
    vi.useRealTimers();
    const variants = [
      { id: "v1", blobUrl: "https://blob.test/enhanced1.jpg" },
    ];
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(
      <ImageEnhancementSheet
        {...defaultProps}
        variants={variants}
      />,
    );

    fireEvent.click(screen.getByLabelText("Delete enhanced variant"));

    // First undo
    if (lastToastInfoCall.action?.onClick) {
      lastToastInfoCall.action.onClick();
    }

    // Then dismiss
    if (lastToastInfoCall.onDismiss) {
      await lastToastInfoCall.onDismiss();
    }

    // Should NOT have made the delete request
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does nothing when trying to delete a non-existent variant", () => {
    const onVariantsChange = vi.fn();

    render(
      <ImageEnhancementSheet
        {...defaultProps}
        variants={[]}
        onVariantsChange={onVariantsChange}
      />,
    );

    // No variants, no delete buttons to click
    expect(
      screen.queryByLabelText("Delete enhanced variant"),
    ).not.toBeInTheDocument();
  });

  it("polls for enhancement result and updates variants", async () => {
    vi.useRealTimers();

    let fetchCallCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        // First call: enhance request
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "processing" }),
        });
      }
      // Subsequent calls: polling — return listing with new enhanced variant
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            images: [
              {
                id: "img-1",
                blobUrl: "https://blob.test/original.jpg",
                type: "ORIGINAL",
                parentImageId: null,
              },
              {
                id: "v-new",
                blobUrl: "https://blob.test/enhanced-new.jpg",
                type: "ENHANCED",
                parentImageId: "img-1",
              },
            ],
          }),
      });
    }) as unknown as typeof fetch;

    const onVariantsChange = vi.fn();

    render(
      <ImageEnhancementSheet
        {...defaultProps}
        onVariantsChange={onVariantsChange}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Generate Enhanced Version"));
    });

    // Wait for polling to trigger and find new variant
    await waitFor(
      () => {
        expect(onVariantsChange).toHaveBeenCalledWith([
          { id: "v-new", blobUrl: "https://blob.test/enhanced-new.jpg" },
        ]);
      },
      { timeout: 10000 },
    );
  });
});
