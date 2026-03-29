import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db } from "@listwell/db";
import { listings, listingImages, user as userTable } from "@listwell/db/schema";
import { inngest } from "../inngest/client";
import { getOrCreateUserCredits, deductCredit } from "../lib/credits";
import { logActivity, ACTIVITY_EVENTS } from "../lib/activity-log";

export const listingsRoutes = new Hono();

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

  // Check if user is suspended
  const userRecord = await db.query.user.findFirst({
    where: eq(userTable.id, user.id),
    columns: { suspended: true },
  });
  if (userRecord?.suspended) {
    return c.json(
      { error: "Your account is suspended. You cannot create new listings." },
      403,
    );
  }

  const body = await c.req.json();
  const description = body.description as string | null | undefined;
  const images = body.images as ImageInput[] | undefined;

  if (!images || images.length === 0) {
    return c.json({ error: "At least one image is required" }, 400);
  }

  if (images.length > 5) {
    return c.json({ error: "Maximum 5 images allowed" }, 400);
  }

  // Credit gate: ensure user has credits
  const credits = await getOrCreateUserCredits(user.id);
  if (credits.balance < 1) {
    return c.json(
      { error: "Insufficient credits", creditsRemaining: 0 },
      402,
    );
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

  // Atomic deduction — if it fails (race condition), clean up
  const deduction = await deductCredit(user.id, listing.id);
  if (!deduction.success) {
    await db.delete(listings).where(eq(listings.id, listing.id));
    return c.json(
      { error: "Insufficient credits", creditsRemaining: 0 },
      402,
    );
  }

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

  await logActivity({
    userId: user.id,
    eventType: ACTIVITY_EVENTS.LISTING_CREATED,
    description: `Created listing with ${imageRecords.length} images`,
    resourceType: "listing",
    resourceId: listing.id,
  });

  const result = {
    ...listing,
    images: imageRecords,
    creditsRemaining: deduction.balance,
  };
  return c.json(result, 201);
});
