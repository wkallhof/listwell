import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock recharts to avoid rendering actual SVG charts in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  CartesianGrid: () => <div data-testid="grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

import { RevenueCostChart } from "../revenue-cost-chart";
import { BarChartCard } from "../bar-chart-card";

describe("RevenueCostChart", () => {
  it("renders empty state when no data", () => {
    render(<RevenueCostChart revenueData={[]} costData={[]} />);
    expect(screen.getByText("No data available yet.")).toBeInTheDocument();
  });

  it("renders chart with data", () => {
    render(
      <RevenueCostChart
        revenueData={[
          {
            date: "2026-03-01",
            purchases: 5,
            grossRevenue: 24.95,
            appleCommission: 7.49,
            netRevenue: 17.47,
          },
        ]}
        costData={[
          { date: "2026-03-01", totalCost: 0.5, listingCount: 8, avgCost: 0.06 },
        ]}
      />,
    );
    expect(screen.getByText("Revenue vs Costs")).toBeInTheDocument();
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });
});

describe("BarChartCard", () => {
  it("renders empty state when no data", () => {
    render(<BarChartCard title="Listings per Day" data={[]} />);
    expect(screen.getByText("No data available yet.")).toBeInTheDocument();
  });

  it("renders chart with data", () => {
    render(
      <BarChartCard
        title="Listings per Day"
        data={[
          { date: "2026-03-01", count: 5 },
          { date: "2026-03-02", count: 3 },
        ]}
      />,
    );
    expect(screen.getByText("Listings per Day")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders custom empty message", () => {
    render(
      <BarChartCard
        title="Signups"
        data={[]}
        emptyMessage="No signups yet."
      />,
    );
    expect(screen.getByText("No signups yet.")).toBeInTheDocument();
  });
});
