import { Hono } from "hono";
import { sql, eq, gte, and, count, sum, avg } from "drizzle-orm";
import type { Column, SQL } from "drizzle-orm";

import { db } from "@listwell/db";
import {
  user,
  listings,
  creditTransactions,
  userCredits,
} from "@listwell/db/schema";

export const adminDashboardRoutes = new Hono();

type Period = "daily" | "weekly" | "monthly";

const CREDIT_PRICE_USD = 4.99;
const APPLE_COMMISSION_RATE = 0.3;

function getPeriodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "daily":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    case "weekly":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    case "monthly":
      return new Date(now.getFullYear() - 1, now.getMonth(), 1);
  }
}

const PERIOD_TO_TRUNC: Record<Period, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

function dateTrunc(period: Period, column: Column): SQL<string> {
  const trunc = PERIOD_TO_TRUNC[period];
  return sql<string>`date_trunc(${sql.raw(`'${trunc}'`)}, ${column})::date`;
}

function parsePeriod(raw: string | undefined): Period {
  if (raw === "weekly" || raw === "monthly") return raw;
  return "daily";
}

// GET /admin/dashboard — aggregated metrics
adminDashboardRoutes.get("/admin/dashboard", async (c) => {
  const period = parsePeriod(c.req.query("period"));

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel
  const [
    totalUsersResult,
    newUsers7dResult,
    newUsers30dResult,
    listingsByStatusResult,
    creditsAggResult,
    revenueResult,
    costResult,
  ] = await Promise.all([
    // Total users
    db.select({ count: count() }).from(user),

    // New users (7 days)
    db
      .select({ count: count() })
      .from(user)
      .where(gte(user.createdAt, sevenDaysAgo)),

    // New users (30 days)
    db
      .select({ count: count() })
      .from(user)
      .where(gte(user.createdAt, thirtyDaysAgo)),

    // Listings by status
    db
      .select({
        status: listings.status,
        count: count(),
      })
      .from(listings)
      .groupBy(listings.status),

    // Credits aggregate (purchased/used/remaining)
    db
      .select({
        totalBalance: sum(userCredits.balance),
      })
      .from(userCredits),

    // Total revenue (PURCHASE transactions)
    db
      .select({
        purchaseCount: count(),
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.type, "PURCHASE")),

    // Total AI costs
    db
      .select({
        totalCost: sum(listings.agentCostUsd),
        avgCost: avg(listings.agentCostUsd),
        processedCount: count(),
      })
      .from(listings)
      .where(sql`${listings.agentCostUsd} is not null`),
  ]);

  const totalUsers = totalUsersResult[0]?.count ?? 0;
  const newUsers7d = newUsers7dResult[0]?.count ?? 0;
  const newUsers30d = newUsers30dResult[0]?.count ?? 0;

  const listingCounts: Record<string, number> = {};
  let totalListings = 0;
  for (const row of listingsByStatusResult) {
    listingCounts[row.status] = row.count;
    totalListings += row.count;
  }

  const totalCreditsRemaining = Number(creditsAggResult[0]?.totalBalance ?? 0);
  const purchaseCount = revenueResult[0]?.purchaseCount ?? 0;
  const grossRevenue = purchaseCount * CREDIT_PRICE_USD;
  const appleCommission = grossRevenue * APPLE_COMMISSION_RATE;
  const netRevenue = grossRevenue - appleCommission;

  const totalCosts = Number(costResult[0]?.totalCost ?? 0);
  const avgCostPerListing = Number(costResult[0]?.avgCost ?? 0);
  const margin = netRevenue - totalCosts;

  return c.json({
    period,
    metrics: {
      totalUsers,
      newUsers7d,
      newUsers30d,
      totalListings,
      listingsByStatus: listingCounts,
      totalCreditsRemaining,
      creditsPurchased: purchaseCount,
      grossRevenue,
      appleCommission,
      netRevenue,
      totalCosts,
      margin,
      avgCostPerListing,
    },
  });
});

// GET /admin/revenue — revenue aggregation by period
adminDashboardRoutes.get("/admin/revenue", async (c) => {
  const period = parsePeriod(c.req.query("period"));
  const periodStart = getPeriodStart(period);
  const dateCol = dateTrunc(period, creditTransactions.createdAt);

  const rows = await db
    .select({
      date: dateCol.as("date"),
      purchases: count(),
    })
    .from(creditTransactions)
    .where(
      and(
        eq(creditTransactions.type, "PURCHASE"),
        gte(creditTransactions.createdAt, periodStart),
      ),
    )
    .groupBy(dateCol)
    .orderBy(dateCol);

  const data = rows.map((row) => {
    const gross = row.purchases * CREDIT_PRICE_USD;
    const commission = gross * APPLE_COMMISSION_RATE;
    return {
      date: row.date,
      purchases: row.purchases,
      grossRevenue: Math.round(gross * 100) / 100,
      appleCommission: Math.round(commission * 100) / 100,
      netRevenue: Math.round((gross - commission) * 100) / 100,
    };
  });

  return c.json({ period, data });
});

// GET /admin/costs — cost aggregation by period
adminDashboardRoutes.get("/admin/costs", async (c) => {
  const period = parsePeriod(c.req.query("period"));
  const periodStart = getPeriodStart(period);
  const dateCol = dateTrunc(period, listings.createdAt);

  const rows = await db
    .select({
      date: dateCol.as("date"),
      totalCost: sum(listings.agentCostUsd),
      listingCount: count(),
      avgCost: avg(listings.agentCostUsd),
    })
    .from(listings)
    .where(
      and(
        sql`${listings.agentCostUsd} is not null`,
        gte(listings.createdAt, periodStart),
      ),
    )
    .groupBy(dateCol)
    .orderBy(dateCol);

  const data = rows.map((row) => ({
    date: row.date,
    totalCost: Math.round(Number(row.totalCost ?? 0) * 100) / 100,
    listingCount: row.listingCount,
    avgCost: Math.round(Number(row.avgCost ?? 0) * 10000) / 10000,
  }));

  return c.json({ period, data });
});

// GET /admin/listings-by-day — listings created per period
adminDashboardRoutes.get("/admin/listings-by-day", async (c) => {
  const period = parsePeriod(c.req.query("period"));
  const periodStart = getPeriodStart(period);
  const dateCol = dateTrunc(period, listings.createdAt);

  const rows = await db
    .select({
      date: dateCol.as("date"),
      count: count(),
    })
    .from(listings)
    .where(gte(listings.createdAt, periodStart))
    .groupBy(dateCol)
    .orderBy(dateCol);

  return c.json({ period, data: rows });
});

// GET /admin/signups-by-day — new user signups per period
adminDashboardRoutes.get("/admin/signups-by-day", async (c) => {
  const period = parsePeriod(c.req.query("period"));
  const periodStart = getPeriodStart(period);
  const dateCol = dateTrunc(period, user.createdAt);

  const rows = await db
    .select({
      date: dateCol.as("date"),
      count: count(),
    })
    .from(user)
    .where(gte(user.createdAt, periodStart))
    .groupBy(dateCol)
    .orderBy(dateCol);

  return c.json({ period, data: rows });
});
