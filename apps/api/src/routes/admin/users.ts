import { Hono } from "hono";
import { eq, sql, desc, asc, and, or, ilike, gte, lte, count } from "drizzle-orm";
import { db } from "@listwell/db";
import {
  user,
  userCredits,
  creditTransactions,
  listings,
  userActivityLog,
} from "@listwell/db/schema";
import { getOrCreateUserCredits } from "../../lib/credits";
import { logActivity, ACTIVITY_EVENTS } from "../../lib/activity-log";

export const adminUsersRoutes = new Hono();

// GET /admin/users — paginated list with search, sort, filters
adminUsersRoutes.get("/admin/users", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;
  const search = c.req.query("search")?.trim();
  const sortBy = c.req.query("sortBy") ?? "createdAt";
  const sortOrder = c.req.query("sortOrder") === "asc" ? "asc" : "desc";
  const hasCredits = c.req.query("hasCredits");
  const hasListings = c.req.query("hasListings");
  const dateFrom = c.req.query("dateFrom");
  const dateTo = c.req.query("dateTo");

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(user.name, `%${search}%`),
        ilike(user.email, `%${search}%`),
      ),
    );
  }

  if (dateFrom) {
    conditions.push(gte(user.createdAt, new Date(dateFrom)));
  }

  if (dateTo) {
    conditions.push(lte(user.createdAt, new Date(dateTo)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(user)
    .where(whereClause);

  // Sort column mapping
  const sortColumnMap = {
    createdAt: user.createdAt,
    name: user.name,
    email: user.email,
  } as const;
  type SortKey = keyof typeof sortColumnMap;
  const sortColumn = sortColumnMap[sortBy as SortKey] ?? user.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  // Query users with left-joined credit balance
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      suspended: user.suspended,
      createdAt: user.createdAt,
      creditBalance: userCredits.balance,
    })
    .from(user)
    .leftJoin(userCredits, eq(user.id, userCredits.userId))
    .where(whereClause)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  // Post-filter for hasCredits / hasListings if requested
  let filteredRows = rows;

  if (hasCredits === "true") {
    filteredRows = filteredRows.filter((r) => (r.creditBalance ?? 0) > 0);
  }

  // For hasListings, batch check listing counts for this page of users
  if (hasListings === "true" || hasListings === "false") {
    const userIds = filteredRows.map((r) => r.id);
    if (userIds.length > 0) {
      const listingCounts = await db
        .select({
          userId: listings.userId,
          count: count(),
        })
        .from(listings)
        .where(sql`${listings.userId} IN ${userIds}`)
        .groupBy(listings.userId);

      const countMap = new Map(listingCounts.map((lc) => [lc.userId, lc.count]));

      if (hasListings === "true") {
        filteredRows = filteredRows.filter((r) => (countMap.get(r.id) ?? 0) > 0);
      } else {
        filteredRows = filteredRows.filter((r) => (countMap.get(r.id) ?? 0) === 0);
      }
    }
  }

  // Fetch listing counts for the page results
  const userIds = filteredRows.map((r) => r.id);
  let listingCountMap = new Map<string, number>();
  if (userIds.length > 0) {
    const listingCounts = await db
      .select({
        userId: listings.userId,
        count: count(),
      })
      .from(listings)
      .where(sql`${listings.userId} IN ${userIds}`)
      .groupBy(listings.userId);
    listingCountMap = new Map(listingCounts.map((lc) => [lc.userId, lc.count]));
  }

  const users = filteredRows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    suspended: r.suspended,
    createdAt: r.createdAt,
    creditBalance: r.creditBalance ?? 0,
    totalListings: listingCountMap.get(r.id) ?? 0,
  }));

  return c.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /admin/users/:id — user detail
adminUsersRoutes.get("/admin/users/:id", async (c) => {
  const userId = c.req.param("id");

  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  const credits = await getOrCreateUserCredits(userId);

  // Listing summary
  const [listingSummary] = await db
    .select({
      total: count(),
      ready: sql<number>`count(*) filter (where ${listings.status} = 'READY')`,
      processing: sql<number>`count(*) filter (where ${listings.status} = 'PROCESSING')`,
      errored: sql<number>`count(*) filter (where ${listings.pipelineStep} = 'ERROR')`,
    })
    .from(listings)
    .where(eq(listings.userId, userId));

  // Recent transactions
  const recentTransactions = await db
    .select({
      id: creditTransactions.id,
      type: creditTransactions.type,
      amount: creditTransactions.amount,
      balanceAfter: creditTransactions.balanceAfter,
      listingId: creditTransactions.listingId,
      appleTransactionId: creditTransactions.appleTransactionId,
      adminUserId: creditTransactions.adminUserId,
      reason: creditTransactions.reason,
      note: creditTransactions.note,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(20);

  // Recent activity
  const recentActivity = await db
    .select()
    .from(userActivityLog)
    .where(eq(userActivityLog.userId, userId))
    .orderBy(desc(userActivityLog.createdAt))
    .limit(10);

  return c.json({
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      suspended: userRecord.suspended,
      suspendedReason: userRecord.suspendedReason,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    },
    credits: {
      balance: credits.balance,
      freeCreditsGranted: credits.freeCreditsGranted,
    },
    listings: listingSummary,
    recentTransactions,
    recentActivity,
  });
});

// POST /admin/users/:id/credits — grant or deduct credits
adminUsersRoutes.post("/admin/users/:id/credits", async (c) => {
  const userId = c.req.param("id");
  const adminUser = c.get("user");
  const body = await c.req.json<{
    action: "grant" | "deduct";
    amount: number;
    reason: string;
  }>();

  if (!body.reason?.trim()) {
    return c.json({ error: "Reason is required" }, 400);
  }

  if (!body.amount || body.amount <= 0 || !Number.isInteger(body.amount)) {
    return c.json({ error: "Amount must be a positive integer" }, 400);
  }

  if (body.action !== "grant" && body.action !== "deduct") {
    return c.json({ error: "Action must be 'grant' or 'deduct'" }, 400);
  }

  // Verify user exists
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  // Ensure credit record exists
  await getOrCreateUserCredits(userId);

  if (body.action === "deduct") {
    // Check sufficient balance
    const current = await db.query.userCredits.findFirst({
      where: eq(userCredits.userId, userId),
    });

    if ((current?.balance ?? 0) < body.amount) {
      return c.json({ error: "Insufficient balance" }, 400);
    }

    const [updated] = await db
      .update(userCredits)
      .set({ balance: sql`${userCredits.balance} - ${body.amount}` })
      .where(eq(userCredits.userId, userId))
      .returning();

    await db.insert(creditTransactions).values({
      userId,
      type: "MANUAL_DEDUCT",
      amount: -body.amount,
      balanceAfter: updated.balance,
      adminUserId: adminUser.id,
      reason: body.reason.trim(),
      note: `Admin deducted ${body.amount} credits`,
    });

    await logActivity({
      userId,
      eventType: ACTIVITY_EVENTS.MANUAL_CREDIT_DEDUCT,
      description: `Admin deducted ${body.amount} credits: ${body.reason.trim()}`,
      metadata: { adminUserId: adminUser.id, amount: body.amount },
    });

    return c.json({ balance: updated.balance });
  }

  // Grant
  const [updated] = await db
    .update(userCredits)
    .set({ balance: sql`${userCredits.balance} + ${body.amount}` })
    .where(eq(userCredits.userId, userId))
    .returning();

  await db.insert(creditTransactions).values({
    userId,
    type: "MANUAL_GRANT",
    amount: body.amount,
    balanceAfter: updated.balance,
    adminUserId: adminUser.id,
    reason: body.reason.trim(),
    note: `Admin granted ${body.amount} credits`,
  });

  await logActivity({
    userId,
    eventType: ACTIVITY_EVENTS.MANUAL_CREDIT_GRANT,
    description: `Admin granted ${body.amount} credits: ${body.reason.trim()}`,
    metadata: { adminUserId: adminUser.id, amount: body.amount },
  });

  return c.json({ balance: updated.balance });
});

// POST /admin/users/:id/suspend — toggle suspension
adminUsersRoutes.post("/admin/users/:id/suspend", async (c) => {
  const userId = c.req.param("id");
  const adminUser = c.get("user");
  const body = await c.req.json<{
    action: "suspend" | "unsuspend";
    reason: string;
  }>();

  if (!body.reason?.trim()) {
    return c.json({ error: "Reason is required" }, 400);
  }

  if (body.action !== "suspend" && body.action !== "unsuspend") {
    return c.json({ error: "Action must be 'suspend' or 'unsuspend'" }, 400);
  }

  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  if (body.action === "suspend") {
    await db
      .update(user)
      .set({ suspended: true, suspendedReason: body.reason.trim() })
      .where(eq(user.id, userId));

    await logActivity({
      userId,
      eventType: ACTIVITY_EVENTS.ACCOUNT_SUSPENDED,
      description: `Account suspended: ${body.reason.trim()}`,
      metadata: { adminUserId: adminUser.id },
    });

    return c.json({ suspended: true });
  }

  // Unsuspend
  await db
    .update(user)
    .set({ suspended: false, suspendedReason: null })
    .where(eq(user.id, userId));

  await logActivity({
    userId,
    eventType: ACTIVITY_EVENTS.ACCOUNT_UNSUSPENDED,
    description: `Account unsuspended: ${body.reason.trim()}`,
    metadata: { adminUserId: adminUser.id },
  });

  return c.json({ suspended: false });
});

// GET /admin/users/:id/activity — paginated activity timeline
adminUsersRoutes.get("/admin/users/:id/activity", async (c) => {
  const userId = c.req.param("id");
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;
  const eventType = c.req.query("eventType");
  const dateFrom = c.req.query("dateFrom");
  const dateTo = c.req.query("dateTo");

  // Verify user exists
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) {
    return c.json({ error: "User not found" }, 404);
  }

  const conditions = [eq(userActivityLog.userId, userId)];

  if (eventType) {
    conditions.push(eq(userActivityLog.eventType, eventType));
  }

  if (dateFrom) {
    conditions.push(gte(userActivityLog.createdAt, new Date(dateFrom)));
  }

  if (dateTo) {
    conditions.push(lte(userActivityLog.createdAt, new Date(dateTo)));
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(userActivityLog)
    .where(whereClause);

  const activities = await db
    .select()
    .from(userActivityLog)
    .where(whereClause)
    .orderBy(desc(userActivityLog.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
