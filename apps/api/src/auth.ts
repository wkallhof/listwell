import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { db } from "@listwell/db";

export const auth = betterAuth({
  baseURL: process.env.API_URL ?? "http://localhost:4000",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.WEB_URL ?? "http://localhost:3000"],
  plugins: [bearer()],
});
