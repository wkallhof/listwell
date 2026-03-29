import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "../page";
import ListingsPage from "../listings/page";
import RevenuePage from "../revenue/page";

describe("Admin placeholder pages", () => {
  it("renders Dashboard page", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  // UsersPage and ActivityPage are now async server components
  // tested via their respective client component tests

  it("renders Listings page", () => {
    render(<ListingsPage />);
    expect(screen.getByText("Listings")).toBeInTheDocument();
  });

  it("renders Revenue & Costs page", () => {
    render(<RevenuePage />);
    expect(screen.getByText("Revenue & Costs")).toBeInTheDocument();
  });
});
