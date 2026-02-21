import { eq } from "drizzle-orm";

import { db } from "@listwell/db";
import { listingImages, listings } from "@listwell/db/schema";
import { inngest } from "../client";
import { enhanceImage } from "../../lib/ai/gemini";
import { buildEnhancementPrompt } from "../../lib/ai/enhancement-prompt";
import { uploadBuffer } from "../../lib/blob";

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

    const result = await step.run(
      "enhance-and-upload",
      async () => {
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
        let contentType: string;
        if (rawContentType && rawContentType !== "application/octet-stream") {
          contentType = rawContentType;
        } else if (image.blobUrl.endsWith(".png")) {
          contentType = "image/png";
        } else {
          contentType = "image/jpeg";
        }

        const enhancementPrompt = buildEnhancementPrompt({
          category: listing?.category,
          condition: listing?.condition,
          title: listing?.title,
        });

        const enhanced = await enhanceImage(base64, contentType, enhancementPrompt);

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
