import { z } from "zod";

const comparableSchema = z.object({
  title: z.string().describe("Title of the comparable listing"),
  price: z.number().describe("Sale or asking price in USD"),
  source: z
    .string()
    .describe("Where it was found (e.g., eBay Sold, FB Marketplace, Amazon)"),
  url: z.string().optional().describe("URL of the comparable listing"),
  condition: z.string().optional().describe("Condition of the comparable item"),
  soldDate: z
    .string()
    .optional()
    .describe("Date sold, if available (YYYY-MM-DD format)"),
});

export const listingAgentOutputSchema = z.object({
  title: z
    .string()
    .describe(
      "Marketplace listing title, 65 chars max, Title Case, Brand + Item Type + Key Spec + Condition",
    ),
  description: z
    .string()
    .describe(
      "Natural, first-person listing description, 80-150 words, conversational tone",
    ),
  suggestedPrice: z
    .number()
    .describe("Suggested listing price in USD (includes 10-15% negotiation buffer)"),
  priceRangeLow: z
    .number()
    .describe("Low end of market price range in USD"),
  priceRangeHigh: z
    .number()
    .describe("High end of market price range in USD"),
  category: z
    .string()
    .describe("Item category (e.g., Electronics, Furniture, Tools, Clothing)"),
  condition: z
    .enum(["New", "Like New", "Good", "Fair", "Poor"])
    .describe("Item condition assessment based on image analysis"),
  brand: z
    .string()
    .describe("Brand name identified from item or packaging"),
  model: z
    .string()
    .optional()
    .describe("Model name or number if identifiable"),
  researchNotes: z
    .string()
    .describe(
      "Market research notes for the seller: market overview, pricing rationale, sell-faster tips, shipping note",
    ),
  comparables: z
    .array(comparableSchema)
    .describe("Comparable listings found during research, 3-8 items"),
});

export type ListingAgentOutput = z.infer<typeof listingAgentOutputSchema>;
