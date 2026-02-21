import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import { fileURLToPath } from "url";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Migrations live at packages/db/migrations relative to the monorepo root.
// From dist/ (apps/api/dist), that's ../../../packages/db/migrations
const migrationsFolder = path.resolve(
  __dirname,
  "../../../packages/db/migrations",
);

const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql);

console.log("Running migrations...");
await migrate(db, { migrationsFolder });
console.log("Migrations complete.");

await sql.end();
