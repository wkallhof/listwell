import { eq, sql } from "drizzle-orm";
import { db } from "@listwell/db";
import { userCredits, creditTransactions } from "@listwell/db/schema";
import { logActivity, ACTIVITY_EVENTS } from "./activity-log";

const FREE_CREDITS = 2;

interface CreditResult {
  balance: number;
  freeCreditsGranted: boolean;
}

interface DeductResult {
  success: boolean;
  balance: number;
}

export async function getOrCreateUserCredits(
  userId: string,
): Promise<CreditResult> {
  const existing = await db.query.userCredits.findFirst({
    where: eq(userCredits.userId, userId),
  });

  if (existing) {
    return {
      balance: existing.balance,
      freeCreditsGranted: existing.freeCreditsGranted,
    };
  }

  const [created] = await db
    .insert(userCredits)
    .values({
      userId,
      balance: FREE_CREDITS,
      freeCreditsGranted: true,
    })
    .onConflictDoNothing({ target: userCredits.userId })
    .returning();

  // Race condition: another request created it between our check and insert
  if (!created) {
    const refetched = await db.query.userCredits.findFirst({
      where: eq(userCredits.userId, userId),
    });
    return {
      balance: refetched!.balance,
      freeCreditsGranted: refetched!.freeCreditsGranted,
    };
  }

  await db.insert(creditTransactions).values({
    userId,
    type: "FREE_GRANT",
    amount: FREE_CREDITS,
    balanceAfter: FREE_CREDITS,
    note: "Welcome bonus: 2 free listing credits",
  });

  await logActivity({
    userId,
    eventType: ACTIVITY_EVENTS.CREDITS_FREE_GRANT,
    description: `Received ${FREE_CREDITS} free welcome credits`,
    metadata: { amount: FREE_CREDITS },
  });

  return { balance: FREE_CREDITS, freeCreditsGranted: true };
}

export async function deductCredit(
  userId: string,
  listingId: string,
): Promise<DeductResult> {
  const [updated] = await db
    .update(userCredits)
    .set({
      balance: sql`${userCredits.balance} - 1`,
    })
    .where(
      sql`${userCredits.userId} = ${userId} AND ${userCredits.balance} >= 1`,
    )
    .returning();

  if (!updated) {
    return { success: false, balance: 0 };
  }

  await db.insert(creditTransactions).values({
    userId,
    type: "USAGE",
    amount: -1,
    balanceAfter: updated.balance,
    listingId,
    note: "Credit used for listing creation",
  });

  await logActivity({
    userId,
    eventType: ACTIVITY_EVENTS.CREDITS_USED,
    description: "Credit used for listing creation",
    resourceType: "listing",
    resourceId: listingId,
  });

  return { success: true, balance: updated.balance };
}

export async function addPurchasedCredits(
  userId: string,
  amount: number,
  appleTransactionId: string,
): Promise<{ alreadyProcessed: boolean; balance: number }> {
  // Idempotency check
  const existing = await db.query.creditTransactions.findFirst({
    where: eq(creditTransactions.appleTransactionId, appleTransactionId),
  });

  if (existing) {
    const credits = await db.query.userCredits.findFirst({
      where: eq(userCredits.userId, userId),
    });
    return { alreadyProcessed: true, balance: credits?.balance ?? 0 };
  }

  // Ensure credit record exists
  await getOrCreateUserCredits(userId);

  const [updated] = await db
    .update(userCredits)
    .set({
      balance: sql`${userCredits.balance} + ${amount}`,
    })
    .where(eq(userCredits.userId, userId))
    .returning();

  await db.insert(creditTransactions).values({
    userId,
    type: "PURCHASE",
    amount,
    balanceAfter: updated.balance,
    appleTransactionId,
    note: `Purchased ${amount} credits via Apple IAP`,
  });

  await logActivity({
    userId,
    eventType: ACTIVITY_EVENTS.CREDITS_PURCHASED,
    description: `Purchased ${amount} credits`,
    metadata: { amount, appleTransactionId },
  });

  return { alreadyProcessed: false, balance: updated.balance };
}

export async function refundCredit(
  userId: string,
  listingId: string,
): Promise<{ balance: number; alreadyRefunded: boolean }> {
  // Idempotency: only refund once per listing
  const existingRefund = await db.query.creditTransactions.findFirst({
    where: sql`${creditTransactions.listingId} = ${listingId} AND ${creditTransactions.type} = 'REFUND'`,
  });

  if (existingRefund) {
    const credits = await db.query.userCredits.findFirst({
      where: eq(userCredits.userId, userId),
    });
    return { balance: credits?.balance ?? 0, alreadyRefunded: true };
  }

  // Ensure credit record exists
  await getOrCreateUserCredits(userId);

  const [updated] = await db
    .update(userCredits)
    .set({
      balance: sql`${userCredits.balance} + 1`,
    })
    .where(eq(userCredits.userId, userId))
    .returning();

  await db.insert(creditTransactions).values({
    userId,
    type: "REFUND",
    amount: 1,
    balanceAfter: updated.balance,
    listingId,
    note: "Auto-refund: AI pipeline failed",
  });

  await logActivity({
    userId,
    eventType: ACTIVITY_EVENTS.CREDITS_REFUNDED,
    description: "Credit refunded: AI pipeline failed",
    resourceType: "listing",
    resourceId: listingId,
  });

  return { balance: updated.balance, alreadyRefunded: false };
}
