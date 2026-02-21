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
import { inngestHandler } from "./inngest/handler";

const app = new Hono().basePath("/api");

// Middleware
app.use(logger());
app.use(
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

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

// Inngest webhook handler
app.on(["GET", "POST", "PUT"], "/inngest", (c) => inngestHandler(c));

const port = parseInt(process.env.PORT ?? "4000", 10);

console.log(`Listwell API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export { app };
