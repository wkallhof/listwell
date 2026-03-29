import { Suspense } from "react";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDetailClient } from "./user-detail-client";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

interface UserDetailData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    suspended: boolean;
    suspendedReason: string | null;
    createdAt: string;
    updatedAt: string;
  };
  credits: {
    balance: number;
    freeCreditsGranted: boolean;
  };
  listings: {
    total: number;
    ready: number;
    processing: number;
    errored: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    listingId: string | null;
    appleTransactionId: string | null;
    adminUserId: string | null;
    reason: string | null;
    note: string | null;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    userId: string;
    eventType: string;
    description: string | null;
    resourceType: string | null;
    resourceId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      }
    >
      <UserDetailContent id={id} />
    </Suspense>
  );
}

async function UserDetailContent({ id }: { id: string }) {
  const res = await apiFetch(`/admin/users/${id}`);

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load user. Status: {res.status}
        </p>
      </div>
    );
  }

  const data = (await res.json()) as UserDetailData;

  // Fetch paginated activity
  const activityRes = await apiFetch(
    `/admin/users/${id}/activity?limit=20`,
  );
  const activityData = activityRes.ok
    ? ((await activityRes.json()) as {
        activities: UserDetailData["recentActivity"];
        pagination: { page: number; total: number; totalPages: number };
      })
    : { activities: data.recentActivity, pagination: { page: 1, total: 0, totalPages: 1 } };

  return (
    <UserDetailClient
      user={data.user}
      credits={data.credits}
      listings={data.listings}
      transactions={data.recentTransactions}
      activities={activityData.activities}
    />
  );
}
