import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "@listwell/db";
import { listings } from "@listwell/db/schema";
import { requireAuth } from "../middleware/auth";
import { inngest } from "../inngest/client";
import { deleteImages } from "../lib/blob";

export const listingDetailRoutes = new Hono();

listingDetailRoutes.use(requireAuth);

listingDetailRoutes.get("/listings/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const listing = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.userId, user.id)),
    with: {
      images: true,
    },
  });

  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }

  return c.json(listing);
});

listingDetailRoutes.patch("/listings/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const existing = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.userId, user.id)),
  });

  if (!existing) {
    return c.json({ error: "Listing not found" }, 404);
  }

  const body = (await c.req.json()) as Record<string, unknown>;

  const allowedFields = [
    "title",
    "description",
    "suggestedPrice",
    "status",
    "rawDescription",
    "category",
    "condition",
    "pipelineStep",
    "pipelineError",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  const [updated] = await db
    .update(listings)
    .set(updates)
    .where(eq(listings.id, id))
    .returning();

  if (body.retry) {
    const listingWithImages = await db.query.listings.findFirst({
      where: eq(listings.id, id),
      with: { images: true },
    });

    if (listingWithImages) {
      await inngest.send({
        name: "listing.submitted",
        data: {
          listingId: id,
          imageUrls: listingWithImages.images
            .filter((img) => img.type === "ORIGINAL")
            .map((img) => img.blobUrl),
          userDescription: listingWithImages.rawDescription,
        },
      });
    }
  }

  return c.json(updated);
});

listingDetailRoutes.delete("/listings/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const existing = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.userId, user.id)),
    with: {
      images: true,
    },
  });

  if (!existing) {
    return c.json({ error: "Listing not found" }, 404);
  }

  const blobUrls = existing.images.map((img) => img.blobUrl);
  await deleteImages(blobUrls);

  await db.delete(listings).where(eq(listings.id, id));

  return c.json({ success: true });
});
