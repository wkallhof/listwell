import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Enums
export const listingStatusEnum = pgEnum("listing_status", [
  "DRAFT",
  "PROCESSING",
  "READY",
  "LISTED",
  "SOLD",
  "ARCHIVED",
]);

export const pipelineStepEnum = pgEnum("pipeline_step", [
  "PENDING",
  "ANALYZING",
  "RESEARCHING",
  "GENERATING",
  "COMPLETE",
  "ERROR",
]);

export const imageTypeEnum = pgEnum("image_type", ["ORIGINAL", "ENHANCED"]);

// Comparable listing shape stored as JSON
export interface Comparable {
  title: string;
  price: number;
  source: string;
  url?: string;
  condition?: string;
  soldDate?: string;
}

// Listings table
export const listings = pgTable("listings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  rawDescription: text("raw_description"),
  title: text("title"),
  description: text("description"),
  suggestedPrice: real("suggested_price"),
  priceRangeLow: real("price_range_low"),
  priceRangeHigh: real("price_range_high"),
  category: text("category"),
  condition: text("condition"),
  brand: text("brand"),
  model: text("model"),
  researchNotes: text("research_notes"),
  comparables: json("comparables").$type<Comparable[]>(),
  status: listingStatusEnum("status").notNull().default("DRAFT"),
  pipelineStep: pipelineStepEnum("pipeline_step")
    .notNull()
    .default("PENDING"),
  pipelineError: text("pipeline_error"),
  inngestRunId: text("inngest_run_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Listing images table
export const listingImages = pgTable("listing_images", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  type: imageTypeEnum("type").notNull().default("ORIGINAL"),
  blobUrl: text("blob_url").notNull(),
  blobKey: text("blob_key").notNull(),
  parentImageId: text("parent_image_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  geminiPrompt: text("gemini_prompt"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Relations
export const listingsRelations = relations(listings, ({ many }) => ({
  images: many(listingImages),
}));

export const listingImagesRelations = relations(
  listingImages,
  ({ one, many }) => ({
    listing: one(listings, {
      fields: [listingImages.listingId],
      references: [listings.id],
    }),
    parentImage: one(listingImages, {
      fields: [listingImages.parentImageId],
      references: [listingImages.id],
      relationName: "enhancedVariants",
    }),
    enhancedVariants: many(listingImages, {
      relationName: "enhancedVariants",
    }),
  })
);
