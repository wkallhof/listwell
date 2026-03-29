"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActivityTimeline } from "@/components/activity-timeline";

const EVENT_TYPE_OPTIONS = [
  "",
  "ACCOUNT_CREATED",
  "LOGIN",
  "LISTING_CREATED",
  "LISTING_SUBMITTED",
  "PIPELINE_COMPLETE",
  "PIPELINE_ERROR",
  "CREDITS_PURCHASED",
  "CREDITS_USED",
  "CREDITS_FREE_GRANT",
  "IMAGE_ENHANCE_REQUESTED",
  "IMAGE_ENHANCE_COMPLETED",
  "IMAGE_ENHANCE_FAILED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_UNSUSPENDED",
  "MANUAL_CREDIT_GRANT",
  "MANUAL_CREDIT_DEDUCT",
] as const;

interface ActivityEntry {
  id: string;
  userId: string;
  eventType: string;
  description: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  userName?: string | null;
  userEmail?: string | null;
}

interface GlobalActivityClientProps {
  activities: ActivityEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  currentEventType: string;
}

export function GlobalActivityClient({
  activities,
  pagination,
  currentEventType,
}: GlobalActivityClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/activity?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Map to the shape ActivityTimeline expects
  const timelineActivities = activities.map((a) => ({
    ...a,
    userName: a.userName ?? undefined,
    userEmail: a.userEmail ?? undefined,
  }));

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={currentEventType}
          onChange={(e) => navigate({ eventType: e.target.value, page: "1" })}
          className="rounded-md border bg-background px-3 py-2 text-sm"
          aria-label="Filter by event type"
        >
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt || "All Events"}
            </option>
          ))}
        </select>
      </div>

      <ActivityTimeline activities={timelineActivities} showUser />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {pagination.total} total events
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ page: String(pagination.page - 1) })}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ page: String(pagination.page + 1) })}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
