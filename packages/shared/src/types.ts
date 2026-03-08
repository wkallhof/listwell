// Shared TypeScript types

export interface AgentLogEntry {
  ts: number;
  type: "status" | "search" | "fetch" | "text" | "write" | "complete" | "error";
  content: string;
}

export interface CreditBalance {
  balance: number;
  freeCreditsGranted: boolean;
}

export interface CreditTransaction {
  id: string;
  type: "FREE_GRANT" | "PURCHASE" | "USAGE" | "REFUND";
  amount: number;
  balanceAfter: number;
  listingId: string | null;
  note: string | null;
  createdAt: string;
}
