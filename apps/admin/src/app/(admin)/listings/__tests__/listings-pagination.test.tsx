import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

import { ListingsPagination } from "../listings-pagination";

describe("ListingsPagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render page info", () => {
    render(
      <ListingsPagination currentPage={2} totalPages={5} total={100} />,
    );

    expect(screen.getByText("Page 2 of 5 (100 total)")).toBeInTheDocument();
  });

  it("should navigate to previous page", async () => {
    const user = userEvent.setup();
    render(
      <ListingsPagination currentPage={3} totalPages={5} total={100} />,
    );

    await user.click(screen.getByRole("button", { name: /previous/i }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=2"));
  });

  it("should navigate to next page", async () => {
    const user = userEvent.setup();
    render(
      <ListingsPagination currentPage={3} totalPages={5} total={100} />,
    );

    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=4"));
  });

  it("should disable previous on first page", () => {
    render(
      <ListingsPagination currentPage={1} totalPages={5} total={100} />,
    );

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("should disable next on last page", () => {
    render(
      <ListingsPagination currentPage={5} totalPages={5} total={100} />,
    );

    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
