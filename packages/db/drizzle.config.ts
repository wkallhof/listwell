import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";

// Load .env.local from API, admin, or monorepo root (first match wins)
config({ path: path.resolve(__dirname, "../../apps/api/.env.local") });
config({ path: path.resolve(__dirname, "../../apps/admin/.env.local") });
config({ path: path.resolve(__dirname, "../../.env.local") });

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
