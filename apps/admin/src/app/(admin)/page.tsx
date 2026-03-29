import { Suspense } from "react";
import { apiFetch } from "@/lib/api";
import type {
  DashboardResponse,
  RevenueDataPoint,
  CostDataPoint,
  TimeSeriesDataPoint,
} from "@/lib/dashboard-types";
import { formatCurrency, formatPercent } from "@/lib/format";
import { MetricCard } from "@/components/metric-card";
import { PeriodToggle } from "@/components/period-toggle";
import { RevenueCostChart } from "@/components/revenue-cost-chart";
import { BarChartCard } from "@/components/bar-chart-card";
import { Skeleton } from "@/components/ui/skeleton";

function marginTrend(margin: number): "up" | "down" | "neutral" {
  if (margin > 0) return "up";
  if (margin < 0) return "down";
  return "neutral";
}

async function DashboardContent({ period }: { period: string }) {
  const [dashRes, revenueRes, costsRes, listingsRes, signupsRes] =
    await Promise.all([
      apiFetch(`/api/admin/dashboard?period=${period}`),
      apiFetch(`/api/admin/revenue?period=${period}`),
      apiFetch(`/api/admin/costs?period=${period}`),
      apiFetch(`/api/admin/listings-by-day?period=${period}`),
      apiFetch(`/api/admin/signups-by-day?period=${period}`),
    ]);

  if (!dashRes.ok) {
    return <p className="text-destructive">Failed to load dashboard data.</p>;
  }

  const { metrics } = (await dashRes.json()) as DashboardResponse;
  const revenueData = revenueRes.ok
    ? ((await revenueRes.json()) as { data: RevenueDataPoint[] }).data
    : [];
  const costData = costsRes.ok
    ? ((await costsRes.json()) as { data: CostDataPoint[] }).data
    : [];
  const listingsData = listingsRes.ok
    ? ((await listingsRes.json()) as { data: TimeSeriesDataPoint[] }).data
    : [];
  const signupsData = signupsRes.ok
    ? ((await signupsRes.json()) as { data: TimeSeriesDataPoint[] }).data
    : [];

  return (
    <>
      {/* Primary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics.grossRevenue)}
          description="Gross revenue from all purchases"
          variant="primary"
        />
        <MetricCard
          label="Net Revenue"
          value={formatCurrency(metrics.netRevenue)}
          description={`After Apple 30% (${formatCurrency(metrics.appleCommission)})`}
          variant="success"
        />
        <MetricCard
          label="Total AI Costs"
          value={formatCurrency(metrics.totalCosts)}
          description={`Avg ${formatCurrency(metrics.avgCostPerListing)} per listing`}
          variant="destructive"
        />
        <MetricCard
          label="Margin"
          value={formatCurrency(metrics.margin)}
          description={
            metrics.netRevenue > 0
              ? `${formatPercent(metrics.margin, metrics.netRevenue)} of net revenue`
              : "No revenue yet"
          }
          trend={marginTrend(metrics.margin)}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total Users"
          value={String(metrics.totalUsers)}
        />
        <MetricCard
          label="New Users (30d)"
          value={String(metrics.newUsers30d)}
          description={`${metrics.newUsers7d} in last 7 days`}
        />
        <MetricCard
          label="Listings Created"
          value={String(metrics.totalListings)}
        />
        <MetricCard
          label="Listings Errored"
          value={String(metrics.listingsByStatus["ERROR"] ?? 0)}
          variant={
            (metrics.listingsByStatus["ERROR"] ?? 0) > 0
              ? "destructive"
              : "default"
          }
        />
        <MetricCard
          label="Credits Purchased"
          value={String(metrics.creditsPurchased)}
        />
        <MetricCard
          label="Avg Cost / Listing"
          value={formatCurrency(metrics.avgCostPerListing)}
        />
      </div>

      {/* Charts */}
      <RevenueCostChart revenueData={revenueData} costData={costData} />
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChartCard
          title="Listings per Day"
          data={listingsData}
          color="hsl(var(--primary))"
        />
        <BarChartCard
          title="New Signups per Day"
          data={signupsData}
          color="hsl(var(--chart-2, 160 60% 45%))"
        />
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[350px] rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </>
  );
}

interface DashboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const period = params.period ?? "daily";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of revenue, costs, and key metrics.
          </p>
        </div>
        <Suspense>
          <PeriodToggle />
        </Suspense>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent period={period} />
      </Suspense>
    </div>
  );
}
