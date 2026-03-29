import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(""),
}));

import { PeriodToggle } from "../period-toggle";

describe("PeriodToggle", () => {
  it("renders all period options", () => {
    render(<PeriodToggle />);
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });

  it("defaults to daily when no search param", () => {
    render(<PeriodToggle />);
    const dailyTab = screen.getByText("Daily");
    expect(dailyTab.closest("[data-state]")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
