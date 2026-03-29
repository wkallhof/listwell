export interface DashboardMetrics {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  totalListings: number;
  listingsByStatus: Record<string, number>;
  totalCreditsRemaining: number;
  creditsPurchased: number;
  grossRevenue: number;
  appleCommission: number;
  netRevenue: number;
  totalCosts: number;
  margin: number;
  avgCostPerListing: number;
}

export interface DashboardResponse {
  period: string;
  metrics: DashboardMetrics;
}

export interface RevenueDataPoint {
  date: string;
  purchases: number;
  grossRevenue: number;
  appleCommission: number;
  netRevenue: number;
}

export interface CostDataPoint {
  date: string;
  totalCost: number;
  listingCount: number;
  avgCost: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}
