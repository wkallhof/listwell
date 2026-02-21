import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db } from "@listwell/db";
import { listings, listingImages } from "@listwell/db/schema";
import { requireAuth } from "../middleware/auth";
import { inngest } from "../inngest/client";

export const listingsRoutes = new Hono();

listingsRoutes.use(requireAuth);

listingsRoutes.get("/listings", async (c) => {
  const user = c.get("user");

  const userListings = await db.query.listings.findMany({
    where: eq(listings.userId, user.id),
    orderBy: [desc(listings.createdAt)],
    with: {
      images: true,
    },
  });

  return c.json(userListings);
});

interface ImageInput {
  key: string;
  url: string;
  filename: string;
}

listingsRoutes.post("/listings", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const description = body.description as string | null | undefined;
  const images = body.images as ImageInput[] | undefined;

  if (!images || images.length === 0) {
    return c.json({ error: "At least one image is required" }, 400);
  }

  if (images.length > 5) {
    return c.json({ error: "Maximum 5 images allowed" }, 400);
  }

  const [listing] = await db
    .insert(listings)
    .values({
      userId: user.id,
      rawDescription: description ?? null,
      status: "DRAFT",
      pipelineStep: "PENDING",
    })
    .returning();

  const imageRecords = await Promise.all(
    images.map(async (image, index) => {
      const [imageRecord] = await db
        .insert(listingImages)
        .values({
          listingId: listing.id,
          type: "ORIGINAL",
          blobUrl: image.url,
          blobKey: image.key,
          sortOrder: index,
          isPrimary: index === 0,
        })
        .returning();

      return imageRecord;
    }),
  );

  await inngest.send({
    name: "listing.submitted",
    data: {
      listingId: listing.id,
      imageUrls: imageRecords.map((img) => img.blobUrl),
      userDescription: description ?? null,
    },
  });

  const result = { ...listing, images: imageRecords };
  return c.json(result, 201);
});
