import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateListing } from "@/inngest/functions/generate-listing";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateListing],
});
