import { eq } from "drizzle-orm";

import { db } from "@listwell/db";
import { listings, type Comparable } from "@listwell/db/schema";
import { inngest } from "../client";
import { runListingAgent, type RunAgentResult } from "../../lib/ai/agent";
import { sendListingReadyNotification } from "../../lib/notifications";

export const generateListing = inngest.createFunction(
  {
    id: "generate-listing",
    retries: 1,
  },
  { event: "listing.submitted" },
  async ({ event, step }) => {
    const { listingId, imageUrls, userDescription } =
      event.data as {
        listingId: string;
        imageUrls: string[];
        userDescription: string | null;
      };

    const agentResult = await step.run("run-agent", async () => {
      await db
        .update(listings)
        .set({
          status: "PROCESSING",
          pipelineStep: "PENDING",
          pipelineError: null,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, listingId));

      try {
        return await runListingAgent({
          listingId,
          imageUrls,
          userDescription,
        });
      } catch (error) {
        await db
          .update(listings)
          .set({
            status: "DRAFT",
            pipelineStep: "ERROR",
            pipelineError:
              error instanceof Error
                ? error.message
                : "Agent execution failed",
            updatedAt: new Date(),
          })
          .where(eq(listings.id, listingId));
        throw error;
      }
    });

    await step.run("complete", async () => {
      const { output, transcriptUrl } = agentResult as RunAgentResult;

      await db
        .update(listings)
        .set({
          title: output.title,
          description: output.description,
          suggestedPrice: output.suggestedPrice,
          priceRangeLow: output.priceRangeLow,
          priceRangeHigh: output.priceRangeHigh,
          category: output.category,
          condition: output.condition,
          brand: output.brand,
          model: output.model ?? null,
          researchNotes: output.researchNotes,
          comparables: output.comparables as Comparable[],
          agentTranscriptUrl: transcriptUrl ?? null,
          status: "READY",
          pipelineStep: "COMPLETE",
          pipelineError: null,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, listingId));

      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, listingId),
      });

      if (listing) {
        await sendListingReadyNotification(listing.userId, listingId, output.title);
      }
    });

    return { listingId, status: "READY" };
  },
);
