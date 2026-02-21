import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";

// Load .env.local from the monorepo root or apps/web
config({ path: path.resolve(__dirname, "../../apps/web/.env.local") });
config({ path: path.resolve(__dirname, "../../.env.local") });

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
