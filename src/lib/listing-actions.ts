"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { listings, listingImages } from "@/db/schema";
import { inngest } from "@/inngest/client";

interface ImageInput {
  key: string;
  url: string;
  filename: string;
}

interface CreateListingInput {
  description?: string;
  images: ImageInput[];
}

interface CreateListingResult {
  success: boolean;
  listingId?: string;
  error?: string;
}

export async function createListing(
  input: CreateListingInput,
): Promise<CreateListingResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const { description, images } = input;

  if (!images || images.length === 0) {
    return { success: false, error: "At least one image is required" };
  }

  if (images.length > 5) {
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

  // Create image records (images already uploaded to R2)
  await Promise.all(
    images.map(async (image, index) => {
      await db.insert(listingImages).values({
        listingId: listing.id,
        type: "ORIGINAL",
        blobUrl: image.url,
        blobKey: image.key,
        sortOrder: index,
        isPrimary: index === 0,
      });
    }),
  );

  // Trigger AI pipeline
  await inngest.send({
    name: "listing.submitted",
    data: {
      listingId: listing.id,
      imageUrls: images.map((img) => img.url),
      userDescription: description ?? null,
    },
  });

  return { success: true, listingId: listing.id };
}
