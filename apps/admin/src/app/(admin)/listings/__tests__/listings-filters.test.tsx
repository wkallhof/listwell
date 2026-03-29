import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

import { ListingsFilters } from "../listings-filters";

describe("ListingsFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render tab buttons", () => {
    render(<ListingsFilters currentTab="all" currentSearch="" />);

    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Processing" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Errored" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ready" })).toBeInTheDocument();
  });

  it("should render search input", () => {
    render(<ListingsFilters currentTab="all" currentSearch="" />);

    expect(screen.getByPlaceholderText("Search title, user...")).toBeInTheDocument();
  });

  it("should navigate on tab change", async () => {
    const user = userEvent.setup();
    render(<ListingsFilters currentTab="all" currentSearch="" />);

    await user.click(screen.getByRole("tab", { name: "Errored" }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("tab=errored"));
  });

  it("should remove tab param when selecting All", async () => {
    const user = userEvent.setup();
    render(<ListingsFilters currentTab="errored" currentSearch="" />);

    await user.click(screen.getByRole("tab", { name: "All" }));

    expect(mockPush).toHaveBeenCalledWith("/listings?");
  });

  it("should submit search on enter", async () => {
    const user = userEvent.setup();
    render(<ListingsFilters currentTab="all" currentSearch="" />);

    const input = screen.getByPlaceholderText("Search title, user...");
    await user.type(input, "couch{Enter}");

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("search=couch"));
  });
});
