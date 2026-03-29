import { db } from "@listwell/db";
import { userActivityLog } from "@listwell/db/schema";

export const ACTIVITY_EVENTS = {
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  LOGIN: "LOGIN",
  LISTING_CREATED: "LISTING_CREATED",
  LISTING_SUBMITTED: "LISTING_SUBMITTED",
  PIPELINE_ANALYZING: "PIPELINE_ANALYZING",
  PIPELINE_RESEARCHING: "PIPELINE_RESEARCHING",
  PIPELINE_GENERATING: "PIPELINE_GENERATING",
  PIPELINE_COMPLETE: "PIPELINE_COMPLETE",
  PIPELINE_ERROR: "PIPELINE_ERROR",
  CREDITS_PURCHASED: "CREDITS_PURCHASED",
  CREDITS_USED: "CREDITS_USED",
  CREDITS_REFUNDED: "CREDITS_REFUNDED",
  CREDITS_FREE_GRANT: "CREDITS_FREE_GRANT",
  IMAGE_ENHANCE_REQUESTED: "IMAGE_ENHANCE_REQUESTED",
  IMAGE_ENHANCE_COMPLETED: "IMAGE_ENHANCE_COMPLETED",
  IMAGE_ENHANCE_FAILED: "IMAGE_ENHANCE_FAILED",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_UNSUSPENDED: "ACCOUNT_UNSUSPENDED",
  MANUAL_CREDIT_GRANT: "MANUAL_CREDIT_GRANT",
  MANUAL_CREDIT_DEDUCT: "MANUAL_CREDIT_DEDUCT",
} as const;

export type ActivityEventType =
  (typeof ACTIVITY_EVENTS)[keyof typeof ACTIVITY_EVENTS];

interface LogActivityParams {
  userId: string;
  eventType: ActivityEventType;
  description?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.insert(userActivityLog).values(params);
  } catch {
    // Fire-and-forget: never throw from activity logging
  }
}
