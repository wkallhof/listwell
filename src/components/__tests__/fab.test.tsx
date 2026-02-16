import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FAB } from "@/components/fab";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("FAB", () => {
  it("renders a button with Plus icon", () => {
    render(<FAB />);
    expect(
      screen.getByRole("button", { name: /create new listing/i }),
    ).toBeInTheDocument();
  });

  it("navigates to /new by default on click", async () => {
    const user = userEvent.setup();
    render(<FAB />);

    await user.click(screen.getByRole("button"));

    expect(mockPush).toHaveBeenCalledWith("/new");
  });

  it("navigates to custom href when provided", async () => {
    const user = userEvent.setup();
    render(<FAB href="/custom" />);

    await user.click(screen.getByRole("button"));

    expect(mockPush).toHaveBeenCalledWith("/custom");
  });

  it("has fixed positioning", () => {
    render(<FAB />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("fixed");
    expect(button.className).toContain("rounded-full");
  });

  it("has press scale animation", () => {
    render(<FAB />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("active:scale-95");
    expect(button.className).toContain("duration-100");
  });
});
