import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "../page";
import UsersPage from "../users/page";
import ListingsPage from "../listings/page";
import RevenuePage from "../revenue/page";
import ActivityPage from "../activity/page";

describe("Admin placeholder pages", () => {
  it("renders Dashboard page", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders Users page", () => {
    render(<UsersPage />);
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("renders Listings page", () => {
    render(<ListingsPage />);
    expect(screen.getByText("Listings")).toBeInTheDocument();
  });

  it("renders Revenue & Costs page", () => {
    render(<RevenuePage />);
    expect(screen.getByText("Revenue & Costs")).toBeInTheDocument();
  });

  it("renders Activity page", () => {
    render(<ActivityPage />);
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });
});
