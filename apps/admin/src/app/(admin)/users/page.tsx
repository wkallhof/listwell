import { Suspense } from "react";
import { UsersListClient } from "./users-list-client";
import { Skeleton } from "@/components/ui/skeleton";

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-muted-foreground">
          Manage user accounts, credits, and suspensions.
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
        <UsersListContent
          page={parseInt(params.page ?? "1", 10)}
          search={params.search ?? ""}
          sortBy={params.sortBy ?? "createdAt"}
          sortOrder={params.sortOrder ?? "desc"}
        />
      </Suspense>
    </div>
  );
}

interface UsersListContentProps {
  page: number;
  search: string;
  sortBy: string;
  sortOrder: string;
}

async function UsersListContent({
  page,
  search,
  sortBy,
  sortOrder,
}: UsersListContentProps) {
  const { apiFetch } = await import("@/lib/api");

  const searchParams = new URLSearchParams({
    page: String(page),
    limit: "20",
    sortBy,
    sortOrder,
  });
  if (search) {
    searchParams.set("search", search);
  }

  const res = await apiFetch(`/admin/users?${searchParams.toString()}`);

  if (!res.ok) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load users. Status: {res.status}
        </p>
      </div>
    );
  }

  const data = (await res.json()) as {
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      suspended: boolean;
      createdAt: string;
      creditBalance: number;
      totalListings: number;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };

  return (
    <UsersListClient
      users={data.users}
      pagination={data.pagination}
      initialSearch={search}
      currentSortBy={sortBy}
      currentSortOrder={sortOrder}
    />
  );
}
