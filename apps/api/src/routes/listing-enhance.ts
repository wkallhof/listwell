import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "@listwell/db";
import { listings, listingImages } from "@listwell/db/schema";
import { requireAuth } from "../middleware/auth";
import { inngest } from "../inngest/client";

export const listingEnhanceRoutes = new Hono();

listingEnhanceRoutes.use(requireAuth);

listingEnhanceRoutes.post("/listings/:id/enhance", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const listing = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.userId, user.id)),
  });

  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }

  const body = await c.req.json();
  const { imageId } = body as { imageId: string };

  if (!imageId) {
    return c.json({ error: "imageId is required" }, 400);
  }

  const image = await db.query.listingImages.findFirst({
    where: and(
      eq(listingImages.id, imageId),
      eq(listingImages.listingId, id),
    ),
  });

  if (!image) {
    return c.json({ error: "Image not found" }, 404);
  }

  if (image.type !== "ORIGINAL") {
    return c.json({ error: "Can only enhance original images" }, 400);
  }

  await inngest.send({
    name: "image.enhance.requested",
    data: {
      imageId,
      listingId: id,
    },
  });

  return c.json({ status: "processing" });
});
