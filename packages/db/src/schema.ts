import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import type { AgentLogEntry } from "@listwell/shared";

// ─── Auth Tables (BetterAuth) ────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ─── User Preferences Table ─────────────────────────────────────────────────

export const userPreferences = pgTable("user_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  themePreference: text("theme_preference").notNull().default("system"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [userPreferences.userId],
      references: [user.id],
    }),
  }),
);

// Auth relations
export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  listings: many(listings),
  pushSubscriptions: many(pushSubscriptions),
  preferences: one(userPreferences),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ─── Push Subscriptions Table ────────────────────────────────────────────────

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("web"),
    endpoint: text("endpoint"),
    p256dh: text("p256dh"),
    auth: text("auth"),
    deviceToken: text("device_token"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("push_sub_userId_idx").on(table.userId),
    index("push_sub_endpoint_idx").on(table.endpoint),
  ],
);

export const pushSubscriptionRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(user, {
      fields: [pushSubscriptions.userId],
      references: [user.id],
    }),
  }),
);

// ─── Enums ───────────────────────────────────────────────────────────────────

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

// ─── Listings Table ──────────────────────────────────────────────────────────

export const listings = pgTable("listings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
  agentLog: json("agent_log").$type<AgentLogEntry[]>(),
  agentTranscriptUrl: text("agent_transcript_url"),
  inngestRunId: text("inngest_run_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─── Listing Images Table ────────────────────────────────────────────────────

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

// ─── Relations ───────────────────────────────────────────────────────────────

export const listingsRelations = relations(listings, ({ one, many }) => ({
  user: one(user, {
    fields: [listings.userId],
    references: [user.id],
  }),
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
  }),
);
