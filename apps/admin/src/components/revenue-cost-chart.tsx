"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueDataPoint, CostDataPoint } from "@/lib/dashboard-types";
import { formatCurrency, formatShortDate } from "@/lib/format";

interface RevenueCostChartProps {
  revenueData: RevenueDataPoint[];
  costData: CostDataPoint[];
}

interface MergedDataPoint {
  date: string;
  netRevenue: number;
  totalCost: number;
  margin: number;
}

const SERIES_LABELS: Record<string, string> = {
  netRevenue: "Net Revenue",
  totalCost: "AI Costs",
  margin: "Margin",
};

export function RevenueCostChart({
  revenueData,
  costData,
}: RevenueCostChartProps) {
  // Merge revenue and cost data by date
  const dateMap = new Map<string, MergedDataPoint>();

  for (const r of revenueData) {
    dateMap.set(r.date, {
      date: r.date,
      netRevenue: r.netRevenue,
      totalCost: 0,
      margin: r.netRevenue,
    });
  }

  for (const c of costData) {
    const existing = dateMap.get(c.date);
    if (existing) {
      existing.totalCost = c.totalCost;
      existing.margin = existing.netRevenue - c.totalCost;
    } else {
      dateMap.set(c.date, {
        date: c.date,
        netRevenue: 0,
        totalCost: c.totalCost,
        margin: -c.totalCost,
      });
    }
  }

  const data = Array.from(dateMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date),
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue vs Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue vs Costs</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tickFormatter={(v: number) => `$${v}`}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                SERIES_LABELS[String(name)] ?? name,
              ]}
              labelFormatter={(label) => formatShortDate(String(label))}
            />
            <Area
              type="monotone"
              dataKey="margin"
              fill="hsl(var(--primary) / 0.1)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="netRevenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="totalCost"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
