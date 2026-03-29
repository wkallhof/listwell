import { Hono } from "hono";
import { eq, and, desc, gte, lte, count } from "drizzle-orm";
import { db } from "@listwell/db";
import { userActivityLog, user } from "@listwell/db/schema";

export const adminActivityRoutes = new Hono();

// GET /admin/activity — global activity feed across all users
adminActivityRoutes.get("/admin/activity", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;
  const eventType = c.req.query("eventType");
  const dateFrom = c.req.query("dateFrom");
  const dateTo = c.req.query("dateTo");

  const conditions = [];

  if (eventType) {
    conditions.push(eq(userActivityLog.eventType, eventType));
  }

  if (dateFrom) {
    conditions.push(gte(userActivityLog.createdAt, new Date(dateFrom)));
  }

  if (dateTo) {
    conditions.push(lte(userActivityLog.createdAt, new Date(dateTo)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(userActivityLog)
    .where(whereClause);

  const activities = await db
    .select({
      id: userActivityLog.id,
      userId: userActivityLog.userId,
      eventType: userActivityLog.eventType,
      description: userActivityLog.description,
      resourceType: userActivityLog.resourceType,
      resourceId: userActivityLog.resourceId,
      metadata: userActivityLog.metadata,
      createdAt: userActivityLog.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(userActivityLog)
    .leftJoin(user, eq(userActivityLog.userId, user.id))
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
