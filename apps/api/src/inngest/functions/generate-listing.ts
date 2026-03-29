import { eq } from "drizzle-orm";

import { db } from "@listwell/db";
import { listings, type Comparable } from "@listwell/db/schema";
import { inngest } from "../client";
import { runListingAgent, type RunAgentResult } from "../../lib/ai/agent";
import { sendListingReadyNotification } from "../../lib/notifications";
import { refundCredit } from "../../lib/credits";
import { logActivity, ACTIVITY_EVENTS } from "../../lib/activity-log";

export const generateListing = inngest.createFunction(
  {
    id: "generate-listing",
    retries: 1,
    onFailure: async ({ event }) => {
      // Refund credit after all retries are exhausted (idempotent)
      const { listingId } = event.data.event.data as { listingId: string };
      const listing = await db.query.listings.findFirst({
        where: eq(listings.id, listingId),
      });
      if (listing) {
        await refundCredit(listing.userId, listingId);
      }
    },
  },
  { event: "listing.submitted" },
  async ({ event, step }) => {
    const { listingId, imageUrls, userDescription } =
      event.data as {
        listingId: string;
        imageUrls: string[];
        userDescription: string | null;
      };

    // Log submission
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });
    const userId = listing?.userId;
    if (userId) {
      await logActivity({
        userId,
        eventType: ACTIVITY_EVENTS.LISTING_SUBMITTED,
        description: "Listing submitted for AI processing",
        resourceType: "listing",
        resourceId: listingId,
      });
    }

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

      if (userId) {
        await logActivity({
          userId,
          eventType: ACTIVITY_EVENTS.PIPELINE_ANALYZING,
          description: "Pipeline started: analyzing images",
          resourceType: "listing",
          resourceId: listingId,
        });
      }

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

        if (userId) {
          await logActivity({
            userId,
            eventType: ACTIVITY_EVENTS.PIPELINE_ERROR,
            description: `Pipeline error: ${error instanceof Error ? error.message : "Agent execution failed"}`,
            resourceType: "listing",
            resourceId: listingId,
          });
        }

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

      const completedListing = await db.query.listings.findFirst({
        where: eq(listings.id, listingId),
      });

      if (completedListing) {
        await sendListingReadyNotification(completedListing.userId, listingId, output.title);
        await logActivity({
          userId: completedListing.userId,
          eventType: ACTIVITY_EVENTS.PIPELINE_COMPLETE,
          description: `Listing ready: ${output.title}`,
          resourceType: "listing",
          resourceId: listingId,
        });
      }
    });

    return { listingId, status: "READY" };
  },
);
