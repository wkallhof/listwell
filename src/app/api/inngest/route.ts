import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateListing } from "@/inngest/functions/generate-listing";
import { enhanceImageFunction } from "@/inngest/functions/enhance-image";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateListing, enhanceImageFunction],
});
