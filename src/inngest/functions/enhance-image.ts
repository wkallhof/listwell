import { eq } from "drizzle-orm";

import { db } from "@/db";
import { listingImages, listings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { enhanceImage } from "@/lib/ai/gemini";
import { buildEnhancementPrompt } from "@/lib/ai/enhancement-prompt";
import { uploadBuffer } from "@/lib/blob";

export const enhanceImageFunction = inngest.createFunction(
  {
    id: "enhance-image",
    retries: 1,
  },
  { event: "image.enhance.requested" },
  async ({ event, step }) => {
    const { imageId, listingId } = event.data as {
      imageId: string;
      listingId: string;
    };

    // Single step: download, enhance, upload
    // Kept as one step to avoid serializing large base64 image data
    // between Inngest steps (which has a 4MB output limit).
    const result = await step.run(
      "enhance-and-upload",
      async () => {
        // 1. Download original image and get listing context
        const image = await db.query.listingImages.findFirst({
          where: eq(listingImages.id, imageId),
        });

        if (!image) {
          throw new Error(`Image ${imageId} not found`);
        }

        if (image.type !== "ORIGINAL") {
          throw new Error("Can only enhance original images");
        }

        const listing = await db.query.listings.findFirst({
          where: eq(listings.id, listingId),
        });

        const response = await fetch(image.blobUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const rawContentType = response.headers.get("content-type");
        const contentType =
          rawContentType && rawContentType !== "application/octet-stream"
            ? rawContentType
            : image.blobUrl.endsWith(".png")
              ? "image/png"
              : "image/jpeg";

        const enhancementPrompt = buildEnhancementPrompt({
          category: listing?.category,
          condition: listing?.condition,
          title: listing?.title,
        });

        // 2. Enhance with Gemini
        const enhanced = await enhanceImage(base64, contentType, enhancementPrompt);

        // 3. Upload enhanced image to Blob and save record
        const ext = enhanced.mimeType.includes("png") ? "png" : "jpg";
        const fileName = `enhanced-${Date.now()}.${ext}`;
        const imageBuffer = Buffer.from(enhanced.imageBase64, "base64");

        const blob = await uploadBuffer(
          imageBuffer,
          `listings/${listingId}/${fileName}`,
          enhanced.mimeType,
        );

        const existingVariants = await db.query.listingImages.findMany({
          where: eq(listingImages.parentImageId, imageId),
        });

        const [newImage] = await db
          .insert(listingImages)
          .values({
            listingId,
            type: "ENHANCED",
            blobUrl: blob.url,
            blobKey: blob.key,
            parentImageId: imageId,
            sortOrder: image.sortOrder,
            isPrimary: false,
            geminiPrompt: enhancementPrompt,
          })
          .returning();

        return {
          imageId: newImage.id,
          blobUrl: newImage.blobUrl,
          variantCount: existingVariants.length + 1,
        };
      },
    );

    return result;
  },
);
