import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db } from "@listwell/db";
import { creditTransactions } from "@listwell/db/schema";
import { getOrCreateUserCredits } from "../lib/credits";

export const creditsRoutes = new Hono();

creditsRoutes.get("/credits", async (c) => {
  const user = c.get("user");
  const credits = await getOrCreateUserCredits(user.id);
  return c.json(credits);
});

creditsRoutes.get("/credits/transactions", async (c) => {
  const user = c.get("user");

  const transactions = await db
    .select({
      id: creditTransactions.id,
      type: creditTransactions.type,
      amount: creditTransactions.amount,
      balanceAfter: creditTransactions.balanceAfter,
      listingId: creditTransactions.listingId,
      note: creditTransactions.note,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, user.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(50);

  return c.json(transactions);
});
