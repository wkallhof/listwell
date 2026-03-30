import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { bearer } from "better-auth/plugins";
import { db } from "@listwell/db";
import { logActivity, ACTIVITY_EVENTS } from "./lib/activity-log";

export const auth = betterAuth({
  baseURL: process.env.API_URL ?? "http://localhost:4000",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },
  trustedOrigins: [process.env.WEB_URL ?? "http://localhost:3000"],
  plugins: [bearer()],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path !== "/sign-up/email" &&
        ctx.path !== "/sign-in/email"
      ) {
        return;
      }

      const body = ctx.body as
        | { user?: { id?: string } }
        | null
        | undefined;
      const userId = body?.user?.id;
      if (!userId) return;

      const isSignUp = ctx.path === "/sign-up/email";
      await logActivity({
        userId,
        eventType: isSignUp
          ? ACTIVITY_EVENTS.ACCOUNT_CREATED
          : ACTIVITY_EVENTS.LOGIN,
        description: isSignUp
          ? "Account created via email"
          : "User signed in",
      });
    }),
  },
});
