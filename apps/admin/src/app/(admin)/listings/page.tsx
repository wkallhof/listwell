import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { STATUS_STYLES, PIPELINE_STYLES } from "@/lib/badge-styles";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListingsFilters } from "./listings-filters";
import { ListingsPagination } from "./listings-pagination";

interface ListingItem {
  id: string;
  title: string | null;
  status: string;
  pipelineStep: string;
  agentCostUsd: number | null;
  createdAt: string;
  thumbnailUrl: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface ListingsResponse {
  data: ListingItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ListingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? params.page : "1";
  const tab = typeof params.tab === "string" ? params.tab : "all";
  const search = typeof params.search === "string" ? params.search : "";
  const userId = typeof params.userId === "string" ? params.userId : "";

  const queryParams = new URLSearchParams();
  queryParams.set("page", page);
  queryParams.set("limit", "20");

  if (tab === "processing") {
    queryParams.set("status", "PROCESSING");
  } else if (tab === "errored") {
    queryParams.set("hasError", "true");
  } else if (tab === "ready") {
    queryParams.set("status", "READY");
  }

  if (search) queryParams.set("search", search);
  if (userId) queryParams.set("userId", userId);

  const res = await apiFetch(`/admin/listings?${queryParams.toString()}`);

  if (!res.ok) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Listings</h1>
        <p className="mt-2 text-destructive">Failed to load listings.</p>
      </div>
    );
  }

  const { data, pagination } = (await res.json()) as ListingsResponse;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Listings</h1>
        <p className="mt-1 text-muted-foreground">
          Browse all listings across all users. Investigate errors.
        </p>
      </div>

      <ListingsFilters currentTab={tab} currentSearch={search} />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Title</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pipeline</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No listings found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    {listing.thumbnailUrl ? (
                      <img
                        src={listing.thumbnailUrl}
                        alt=""
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="hover:underline"
                    >
                      {listing.title ?? "Untitled"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/users/${listing.user.id}`}
                      className="text-muted-foreground hover:underline"
                    >
                      {listing.user.name ?? listing.user.email}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_STYLES[listing.status] ?? ""}
                    >
                      {listing.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={PIPELINE_STYLES[listing.pipelineStep] ?? ""}
                    >
                      {listing.pipelineStep}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {listing.agentCostUsd != null
                      ? `$${listing.agentCostUsd.toFixed(4)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <ListingsPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      )}
    </div>
  );
}
