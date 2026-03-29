import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ListingsPage from "../listings/page";

// Dashboard and Revenue pages are async server components — tested via integration
// UsersPage and ActivityPage are async server components — tested via client component tests

describe("Admin placeholder pages", () => {
  it("renders Listings page", () => {
    render(<ListingsPage />);
    expect(screen.getByText("Listings")).toBeInTheDocument();
  });
});
