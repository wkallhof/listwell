import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@listwell/db", () => ({
  db: {
    query: {
      userCredits: {
        findFirst: vi.fn(),
      },
      creditTransactions: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@listwell/db/schema", () => ({
  userCredits: {
    userId: "user_id",
    balance: "balance",
  },
  creditTransactions: {
    appleTransactionId: "apple_transaction_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((_field: unknown, value: unknown) => ({ field: _field, value })),
  sql: vi.fn((...args: unknown[]) => ({ sql: true, args })),
}));

import { db } from "@listwell/db";
import {
  getOrCreateUserCredits,
  deductCredit,
  addPurchasedCredits,
  refundCredit,
} from "./credits";

function mockInsert(returning: unknown[] = []) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
  vi.mocked(db.insert).mockReturnValue(chain as never);
  return chain;
}

function mockUpdate(returning: unknown[] = []) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
  vi.mocked(db.update).mockReturnValue(chain as never);
  return chain;
}

describe("getOrCreateUserCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return existing credits when found", async () => {
    vi.mocked(db.query.userCredits.findFirst).mockResolvedValue({
      id: "credit-1",
      userId: "user-1",
      balance: 5,
      freeCreditsGranted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getOrCreateUserCredits("user-1");

    expect(result).toEqual({ balance: 5, freeCreditsGranted: true });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should create credits with 2 free credits for new users", async () => {
    vi.mocked(db.query.userCredits.findFirst).mockResolvedValue(undefined);
    mockInsert([
      {
        id: "credit-new",
        userId: "user-1",
        balance: 2,
        freeCreditsGranted: true,
      },
    ]);

    const result = await getOrCreateUserCredits("user-1");

    expect(result).toEqual({ balance: 2, freeCreditsGranted: true });
    expect(db.insert).toHaveBeenCalledTimes(2); // userCredits + transaction
  });

  it("should handle race condition on insert conflict", async () => {
    vi.mocked(db.query.userCredits.findFirst)
      .mockResolvedValueOnce(undefined) // first lookup returns nothing
      .mockResolvedValueOnce({
        // refetch after conflict
        id: "credit-1",
        userId: "user-1",
        balance: 2,
        freeCreditsGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // onConflictDoNothing returns empty array
    mockInsert([]);

    const result = await getOrCreateUserCredits("user-1");

    expect(result).toEqual({ balance: 2, freeCreditsGranted: true });
  });
});

describe("deductCredit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deduct credit and record transaction on success", async () => {
    mockUpdate([{ id: "credit-1", userId: "user-1", balance: 1 }]);
    mockInsert([]);

    const result = await deductCredit("user-1", "listing-1");

    expect(result).toEqual({ success: true, balance: 1 });
  });

  it("should return failure when balance is insufficient", async () => {
    mockUpdate([]);

    const result = await deductCredit("user-1", "listing-1");

    expect(result).toEqual({ success: false, balance: 0 });
    // Should not insert a transaction
    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("addPurchasedCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return early if transaction already processed", async () => {
    vi.mocked(db.query.creditTransactions.findFirst).mockResolvedValue({
      id: "txn-1",
      userId: "user-1",
      type: "PURCHASE",
      amount: 5,
      balanceAfter: 7,
      appleTransactionId: "apple-123",
      listingId: null,
      adminUserId: null,
      reason: null,
      note: null,
      createdAt: new Date(),
    });

    vi.mocked(db.query.userCredits.findFirst).mockResolvedValue({
      id: "credit-1",
      userId: "user-1",
      balance: 7,
      freeCreditsGranted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await addPurchasedCredits("user-1", 5, "apple-123");

    expect(result).toEqual({ alreadyProcessed: true, balance: 7 });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("should add credits for new transaction", async () => {
    vi.mocked(db.query.creditTransactions.findFirst).mockResolvedValue(
      undefined,
    );

    // getOrCreateUserCredits call
    vi.mocked(db.query.userCredits.findFirst).mockResolvedValue({
      id: "credit-1",
      userId: "user-1",
      balance: 0,
      freeCreditsGranted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUpdate([{ id: "credit-1", userId: "user-1", balance: 5 }]);
    mockInsert([]);

    const result = await addPurchasedCredits("user-1", 5, "apple-456");

    expect(result).toEqual({ alreadyProcessed: false, balance: 5 });
  });
});

describe("refundCredit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add 1 credit back and record REFUND transaction", async () => {
    // getOrCreateUserCredits call
    vi.mocked(db.query.userCredits.findFirst).mockResolvedValue({
      id: "credit-1",
      userId: "user-1",
      balance: 0,
      freeCreditsGranted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockUpdate([{ id: "credit-1", userId: "user-1", balance: 1 }]);
    mockInsert([]);

    const result = await refundCredit("user-1", "listing-1");

    expect(result).toEqual({ balance: 1, alreadyRefunded: false });
  });
});
