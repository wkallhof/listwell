import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalActivityClient } from "./global-activity-client";

interface ActivityPageProps {
  searchParams: Promise<{
    page?: string;
    eventType?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

interface ActivityEntry {
  id: string;
  userId: string;
  eventType: string;
  description: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="mt-1 text-muted-foreground">
          Global activity feed across all users.
        </p>
      </div>
      <Suspense
        key={JSON.stringify(params)}
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <ActivityContent
          page={parseInt(params.page ?? "1", 10)}
          eventType={params.eventType ?? ""}
          dateFrom={params.dateFrom ?? ""}
          dateTo={params.dateTo ?? ""}
        />
      </Suspense>
    </div>
  );
}

interface ActivityContentProps {
  page: number;
  eventType: string;
  dateFrom: string;
  dateTo: string;
}

async function ActivityContent({
  page,
  eventType,
  dateFrom,
  dateTo,
}: ActivityContentProps) {
  const { apiFetch } = await import("@/lib/api");

  const searchParams = new URLSearchParams({
    page: String(page),
    limit: "30",
  });
  if (eventType) searchParams.set("eventType", eventType);
  if (dateFrom) searchParams.set("dateFrom", dateFrom);
  if (dateTo) searchParams.set("dateTo", dateTo);

  const res = await apiFetch(`/admin/activity?${searchParams.toString()}`);

  if (!res.ok) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load activity. Status: {res.status}
        </p>
      </div>
    );
  }

  const data = (await res.json()) as {
    activities: ActivityEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };

  return (
    <GlobalActivityClient
      activities={data.activities}
      pagination={data.pagination}
      currentEventType={eventType}
    />
  );
}
