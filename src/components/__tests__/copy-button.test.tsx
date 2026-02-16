import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "@/components/copy-button";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock clipboard globally at module scope
const mockWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  mockWriteText.mockClear();
  mockWriteText.mockResolvedValue(undefined);
  // Re-define clipboard each time to ensure fresh reference
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  });
});

describe("CopyButton", () => {
  it("renders a copy button with aria-label", () => {
    render(<CopyButton text="Hello" label="Title" />);
    expect(
      screen.getByRole("button", { name: /copy title/i }),
    ).toBeInTheDocument();
  });

  it("renders with default aria-label when no label provided", () => {
    render(<CopyButton text="Hello" />);
    expect(
      screen.getByRole("button", { name: /copy text/i }),
    ).toBeInTheDocument();
  });

  it("calls clipboard.writeText and shows toast with label", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<CopyButton text="Test content" label="Title" />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Title copied");
    });
  });

  it("shows generic toast when no label provided", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<CopyButton text="Test" />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Copied!");
    });
  });
});
