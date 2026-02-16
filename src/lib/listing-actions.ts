"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { listings, listingImages } from "@/db/schema";
import { uploadImage } from "@/lib/blob";
import { inngest } from "@/inngest/client";

interface CreateListingResult {
  success: boolean;
  listingId?: string;
  error?: string;
}

export async function createListing(
  formData: FormData,
): Promise<CreateListingResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const description = formData.get("description") as string | null;
  const files = formData.getAll("images") as File[];

  if (files.length === 0) {
    return { success: false, error: "At least one image is required" };
  }

  if (files.length > 5) {
    return { success: false, error: "Maximum 5 images allowed" };
  }

  // Create listing record
  const [listing] = await db
    .insert(listings)
    .values({
      userId: session.user.id,
      rawDescription: description || null,
      status: "DRAFT",
      pipelineStep: "PENDING",
    })
    .returning();

  // Upload images and create records
  await Promise.all(
    files.map(async (file, index) => {
      const { url, key } = await uploadImage(file, listing.id);

      await db.insert(listingImages).values({
        listingId: listing.id,
        type: "ORIGINAL",
        blobUrl: url,
        blobKey: key,
        sortOrder: index,
        isPrimary: index === 0,
      });
    }),
  );

  // Trigger AI pipeline
  const imageRecords = await db.query.listingImages.findMany({
    where: (img, { eq }) => eq(img.listingId, listing.id),
  });

  await inngest.send({
    name: "listing.submitted",
    data: {
      listingId: listing.id,
      imageUrls: imageRecords.map((img) => img.blobUrl),
      userDescription: description,
    },
  });

  return { success: true, listingId: listing.id };
}
