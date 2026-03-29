import { Hono } from "hono";
import { eq, and, sql, desc, ilike, or } from "drizzle-orm";
import { db } from "@listwell/db";
import {
  listings,
  listingImages,
  user,
  creditTransactions,
} from "@listwell/db/schema";

export const adminListingsRoutes = new Hono();

adminListingsRoutes.get("/admin/listings", async (c) => {
  const page = parseInt(c.req.query("page") ?? "1", 10);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 100);
  const offset = (page - 1) * limit;

  const status = c.req.query("status");
  const pipelineStep = c.req.query("pipelineStep");
  const userId = c.req.query("userId");
  const hasError = c.req.query("hasError");
  const search = c.req.query("search");
  const dateFrom = c.req.query("dateFrom");
  const dateTo = c.req.query("dateTo");
  const sortBy = c.req.query("sortBy") ?? "createdAt";
  const sortOrder = c.req.query("sortOrder") ?? "desc";

  const conditions = [];

  if (status) {
    conditions.push(sql`${listings.status} = ${status}`);
  }
  if (pipelineStep) {
    conditions.push(sql`${listings.pipelineStep} = ${pipelineStep}`);
  }
  if (userId) {
    conditions.push(eq(listings.userId, userId));
  }
  if (hasError === "true") {
    conditions.push(sql`${listings.pipelineStep} = 'ERROR'`);
  }
  if (search) {
    conditions.push(
      or(
        ilike(listings.title, `%${search}%`),
        ilike(user.name, `%${search}%`),
        ilike(user.email, `%${search}%`),
      ),
    );
  }
  if (dateFrom) {
    conditions.push(sql`${listings.createdAt} >= ${dateFrom}::timestamptz`);
  }
  if (dateTo) {
    conditions.push(sql`${listings.createdAt} <= ${dateTo}::timestamptz`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumnMap = {
    title: listings.title,
    status: listings.status,
    pipelineStep: listings.pipelineStep,
    cost: listings.agentCostUsd,
    createdAt: listings.createdAt,
  } as const;

  const sortColumn =
    sortColumnMap[sortBy as keyof typeof sortColumnMap] ?? listings.createdAt;

  const orderBy =
    sortOrder === "asc" ? sql`${sortColumn} asc` : desc(sortColumn);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: listings.id,
        title: listings.title,
        status: listings.status,
        pipelineStep: listings.pipelineStep,
        agentCostUsd: listings.agentCostUsd,
        createdAt: listings.createdAt,
        userId: listings.userId,
        userName: user.name,
        userEmail: user.email,
      })
      .from(listings)
      .leftJoin(user, eq(listings.userId, user.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .leftJoin(user, eq(listings.userId, user.id))
      .where(where),
  ]);

  // Fetch primary images for the returned listings
  const listingIds = items.map((item) => item.id);
  const primaryImages =
    listingIds.length > 0
      ? await db
          .select({
            listingId: listingImages.listingId,
            blobUrl: listingImages.blobUrl,
          })
          .from(listingImages)
          .where(
            and(
              sql`${listingImages.listingId} IN ${listingIds}`,
              eq(listingImages.isPrimary, true),
            ),
          )
      : [];

  const imageMap = new Map(
    primaryImages.map((img) => [img.listingId, img.blobUrl]),
  );

  const data = items.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    pipelineStep: item.pipelineStep,
    agentCostUsd: item.agentCostUsd,
    createdAt: item.createdAt,
    thumbnailUrl: imageMap.get(item.id) ?? null,
    user: {
      id: item.userId,
      name: item.userName,
      email: item.userEmail,
    },
  }));

  const total = countResult[0]?.count ?? 0;

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

adminListingsRoutes.get("/admin/listings/:id", async (c) => {
  const id = c.req.param("id");

  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
    with: {
      images: true,
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }

  // Find associated credit transaction (USAGE or REFUND for this listing)
  const creditTxn = await db.query.creditTransactions.findFirst({
    where: eq(creditTransactions.listingId, id),
  });

  return c.json({
    ...listing,
    creditTransaction: creditTxn ?? null,
  });
});
