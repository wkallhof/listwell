import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
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
  trustedOrigins: [process.env.WEB_URL ?? "http://localhost:3000"],
  plugins: [bearer()],
  hooks: {
    after: [
      {
        matcher(context) {
          return (
            context.path === "/sign-up/email" ||
            context.path === "/sign-in/email"
          );
        },
        handler: async (ctx) => {
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
        },
      },
    ],
  },
});
