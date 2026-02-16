import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const isProduction = process.env.VERCEL === "1";

function createDb() {
  if (isProduction) {
    return drizzleNeon(process.env.DATABASE_URL!, { schema });
  }

  const client = postgres(process.env.DATABASE_URL!);
  return drizzlePostgres(client, { schema });
}

export const db = createDb();
