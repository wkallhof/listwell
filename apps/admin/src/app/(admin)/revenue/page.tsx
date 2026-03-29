import { Suspense } from "react";
import { apiFetch } from "@/lib/api";
import type {
  DashboardMetrics,
  RevenueDataPoint,
  CostDataPoint,
} from "@/lib/dashboard-types";
import { formatCurrency, formatFullDate } from "@/lib/format";
import { MetricCard } from "@/components/metric-card";
import { PeriodToggle } from "@/components/period-toggle";
import { RevenueCostChart } from "@/components/revenue-cost-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function marginTrend(margin: number): "up" | "down" | "neutral" {
  if (margin > 0) return "up";
  if (margin < 0) return "down";
  return "neutral";
}

async function RevenueContent({ period }: { period: string }) {
  const [dashRes, revenueRes, costsRes] = await Promise.all([
    apiFetch(`/api/admin/dashboard?period=${period}`),
    apiFetch(`/api/admin/revenue?period=${period}`),
    apiFetch(`/api/admin/costs?period=${period}`),
  ]);

  if (!dashRes.ok) {
    return <p className="text-destructive">Failed to load revenue data.</p>;
  }

  const { metrics } = (await dashRes.json()) as { metrics: DashboardMetrics };
  const revenueData = revenueRes.ok
    ? ((await revenueRes.json()) as { data: RevenueDataPoint[] }).data
    : [];
  const costData = costsRes.ok
    ? ((await costsRes.json()) as { data: CostDataPoint[] }).data
    : [];

  const marginPercent =
    metrics.netRevenue > 0
      ? ((metrics.margin / metrics.netRevenue) * 100).toFixed(1)
      : "0";

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Gross Revenue"
          value={formatCurrency(metrics.grossRevenue)}
          description={`${metrics.creditsPurchased} purchases × $4.99`}
          variant="primary"
        />
        <MetricCard
          label="Net Revenue"
          value={formatCurrency(metrics.netRevenue)}
          description={`Apple commission: ${formatCurrency(metrics.appleCommission)}`}
          variant="success"
        />
        <MetricCard
          label="Total AI Costs"
          value={formatCurrency(metrics.totalCosts)}
          description={`Avg ${formatCurrency(metrics.avgCostPerListing)} / listing`}
          variant="destructive"
        />
        <MetricCard
          label="Operating Margin"
          value={formatCurrency(metrics.margin)}
          description={`${marginPercent}% of net revenue`}
          trend={marginTrend(metrics.margin)}
        />
      </div>

      {/* Chart */}
      <RevenueCostChart revenueData={revenueData} costData={costData} />

      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No revenue data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 text-right font-medium">Purchases</th>
                    <th className="pb-2 text-right font-medium">Gross</th>
                    <th className="pb-2 text-right font-medium">Commission</th>
                    <th className="pb-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((row) => (
                    <tr key={row.date} className="border-b last:border-0">
                      <td className="py-2">{formatFullDate(row.date)}</td>
                      <td className="py-2 text-right">{row.purchases}</td>
                      <td className="py-2 text-right">{formatCurrency(row.grossRevenue)}</td>
                      <td className="py-2 text-right text-muted-foreground">
                        -{formatCurrency(row.appleCommission)}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(row.netRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {costData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cost data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 text-right font-medium">Listings</th>
                    <th className="pb-2 text-right font-medium">Total Cost</th>
                    <th className="pb-2 text-right font-medium">Avg Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.map((row) => (
                    <tr key={row.date} className="border-b last:border-0">
                      <td className="py-2">{formatFullDate(row.date)}</td>
                      <td className="py-2 text-right">{row.listingCount}</td>
                      <td className="py-2 text-right">{formatCurrency(row.totalCost)}</td>
                      <td className="py-2 text-right text-muted-foreground">
                        {formatCurrency(row.avgCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function RevenueSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[350px] rounded-xl" />
      <Skeleton className="h-[300px] rounded-xl" />
      <Skeleton className="h-[300px] rounded-xl" />
    </>
  );
}

interface RevenuePageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function RevenuePage({ searchParams }: RevenuePageProps) {
  const params = await searchParams;
  const period = params.period ?? "daily";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue & Costs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue breakdown, AI costs, and margin analysis.
          </p>
        </div>
        <Suspense>
          <PeriodToggle />
        </Suspense>
      </div>

      <Suspense fallback={<RevenueSkeleton />}>
        <RevenueContent period={period} />
      </Suspense>
    </div>
  );
}
