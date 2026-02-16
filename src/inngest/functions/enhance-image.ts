import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";

import { db } from "@/db";
import { listingImages, listings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { enhanceImage } from "@/lib/ai/gemini";
import { buildEnhancementPrompt } from "@/lib/ai/enhancement-prompt";

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

    // Step 1: Download original image and get listing context
    const { imageBase64, mimeType, prompt, sortOrder } = await step.run(
      "download-original",
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
        const contentType = response.headers.get("content-type") ?? "image/jpeg";

        const enhancementPrompt = buildEnhancementPrompt({
          category: listing?.category,
          condition: listing?.condition,
          title: listing?.title,
        });

        return {
          imageBase64: base64,
          mimeType: contentType,
          prompt: enhancementPrompt,
          sortOrder: image.sortOrder,
        };
      },
    );

    // Step 2: Enhance with Gemini
    const enhanced = await step.run("enhance-with-gemini", async () => {
      return await enhanceImage(imageBase64, mimeType, prompt);
    });

    // Step 3: Upload enhanced image to Vercel Blob and save record
    const result = await step.run("upload-enhanced", async () => {
      const ext = enhanced.mimeType.includes("png") ? "png" : "jpg";
      const fileName = `enhanced-${Date.now()}.${ext}`;
      const imageBuffer = Buffer.from(enhanced.imageBase64, "base64");

      const blob = await put(
        `listings/${listingId}/${fileName}`,
        imageBuffer,
        {
          access: "public",
          contentType: enhanced.mimeType,
          addRandomSuffix: true,
        },
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
          blobKey: blob.pathname,
          parentImageId: imageId,
          sortOrder,
          isPrimary: false,
          geminiPrompt: prompt,
        })
        .returning();

      return {
        imageId: newImage.id,
        blobUrl: newImage.blobUrl,
        variantCount: existingVariants.length + 1,
      };
    });

    return result;
  },
);
