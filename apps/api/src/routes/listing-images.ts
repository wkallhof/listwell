import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "@listwell/db";
import { listings, listingImages } from "@listwell/db/schema";
import { deleteImage } from "../lib/blob";

export const listingImagesRoutes = new Hono();

listingImagesRoutes.delete("/listings/:id/images", async (c) => {
  const user = c.get("user");
  const listingId = c.req.param("id");

  const listing = await db.query.listings.findFirst({
    where: and(
      eq(listings.id, listingId),
      eq(listings.userId, user.id),
    ),
  });

  if (!listing) {
    return c.json({ error: "Listing not found" }, 404);
  }

  const imageId = c.req.query("imageId");

  if (!imageId) {
    return c.json({ error: "imageId query parameter is required" }, 400);
  }

  const image = await db.query.listingImages.findFirst({
    where: and(
      eq(listingImages.id, imageId),
      eq(listingImages.listingId, listingId),
    ),
  });

  if (!image) {
    return c.json({ error: "Image not found" }, 404);
  }

  // Prevent deleting the last remaining image
  const allImages = await db.query.listingImages.findMany({
    where: eq(listingImages.listingId, listingId),
  });

  if (allImages.length <= 1) {
    return c.json(
      { error: "Cannot delete the last image. Delete the listing instead." },
      400,
    );
  }

  await deleteImage(image.blobUrl);
  await db.delete(listingImages).where(eq(listingImages.id, imageId));

  return c.json({ success: true });
});
