import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "../metric-card";

describe("MetricCard", () => {
  it("renders label and value", () => {
    render(<MetricCard label="Total Users" value="42" />);
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <MetricCard label="Revenue" value="$100" description="Gross revenue" />,
    );
    expect(screen.getByText("Gross revenue")).toBeInTheDocument();
  });

  it("shows up trend indicator", () => {
    render(<MetricCard label="Margin" value="$50" trend="up" />);
    expect(screen.getByText("↑")).toBeInTheDocument();
  });

  it("shows down trend indicator", () => {
    render(<MetricCard label="Costs" value="$20" trend="down" />);
    expect(screen.getByText("↓")).toBeInTheDocument();
  });

  it("does not show trend indicator for neutral", () => {
    render(<MetricCard label="Margin" value="$0" trend="neutral" />);
    expect(screen.queryByText("↑")).not.toBeInTheDocument();
    expect(screen.queryByText("↓")).not.toBeInTheDocument();
  });
});
