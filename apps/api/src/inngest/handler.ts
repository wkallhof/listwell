import { serve } from "inngest/hono";
import { inngest } from "./client";
import { generateListing } from "./functions/generate-listing";
import { enhanceImageFunction } from "./functions/enhance-image";

export const inngestHandler = serve({
  client: inngest,
  functions: [generateListing, enhanceImageFunction],
});
