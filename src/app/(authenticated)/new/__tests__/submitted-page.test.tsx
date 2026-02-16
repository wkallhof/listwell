import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import SubmittedPage from "@/app/(authenticated)/new/submitted/page";

describe("SubmittedPage", () => {
  it("renders confirmation message", () => {
    render(<SubmittedPage />);

    expect(screen.getByText("You're all set")).toBeInTheDocument();
    expect(
      screen.getByText(/analyzing your photos and researching prices/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/notification when it's ready/),
    ).toBeInTheDocument();
  });

  it("renders Back to Listings button", () => {
    render(<SubmittedPage />);

    expect(
      screen.getByRole("button", { name: "Back to Listings" }),
    ).toBeInTheDocument();
  });

  it("navigates to feed on button click", async () => {
    const user = userEvent.setup();

    render(<SubmittedPage />);

    await user.click(screen.getByText("Back to Listings"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
