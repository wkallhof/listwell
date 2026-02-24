import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";

import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { listingsRoutes } from "./routes/listings";
import { listingDetailRoutes } from "./routes/listing-detail";
import { listingImagesRoutes } from "./routes/listing-images";
import { listingEnhanceRoutes } from "./routes/listing-enhance";
import { uploadRoutes } from "./routes/upload";
import { transcribeRoutes } from "./routes/transcribe";
import { pushRoutes } from "./routes/push";
import { preferencesRoutes } from "./routes/preferences";
import { meRoutes } from "./routes/me";
import { inngestHandler } from "./inngest/handler";
import { requireAuth } from "./middleware/auth";

const app = new Hono<{ Bindings: Record<string, string | undefined> }>().basePath("/api");

// Middleware
// Expose process.env as Hono context bindings so inngest/hono can read env vars
app.use(async (c, next) => {
  Object.assign(c.env, process.env);
  return next();
});
app.use(logger());
app.use(
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

// Auth middleware — scoped to protected paths only
// (health, auth, and inngest remain public)
app.use("/listings", requireAuth);
app.use("/listings/*", requireAuth);
app.use("/upload/*", requireAuth);
app.use("/transcribe", requireAuth);
app.use("/push/*", requireAuth);
app.use("/preferences", requireAuth);
app.use("/me", requireAuth);

// Routes
app.route("/", authRoutes);
app.route("/", healthRoutes);
app.route("/", listingsRoutes);
app.route("/", listingDetailRoutes);
app.route("/", listingImagesRoutes);
app.route("/", listingEnhanceRoutes);
app.route("/", uploadRoutes);
app.route("/", transcribeRoutes);
app.route("/", pushRoutes);
app.route("/", preferencesRoutes);
app.route("/", meRoutes);

// Inngest webhook handler
app.on(["GET", "POST", "PUT"], "/inngest", (c) => inngestHandler(c));

const port = parseInt(process.env.PORT ?? "4000", 10);

console.log(`Listwell API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export { app };
