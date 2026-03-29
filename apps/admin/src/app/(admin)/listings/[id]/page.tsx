import Link from "next/link";
import { notFound } from "next/navigation";
import type { AgentLogEntry, CreditTransaction } from "@listwell/shared";
import { apiFetch } from "@/lib/api";
import { STATUS_STYLES, PIPELINE_STYLES } from "@/lib/badge-styles";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AgentLogViewer } from "@/components/agent-log-viewer";
import {
  ExternalLink,
  DollarSign,
  Cpu,
  User,
  AlertTriangle,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListingImage {
  id: string;
  type: string;
  blobUrl: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface Comparable {
  title: string;
  price: number;
  source: string;
  url?: string;
  condition?: string;
  soldDate?: string;
}

interface ListingDetail {
  id: string;
  userId: string;
  rawDescription: string | null;
  title: string | null;
  description: string | null;
  suggestedPrice: number | null;
  priceRangeLow: number | null;
  priceRangeHigh: number | null;
  category: string | null;
  condition: string | null;
  brand: string | null;
  model: string | null;
  researchNotes: string | null;
  comparables: Comparable[] | null;
  status: string;
  pipelineStep: string;
  pipelineError: string | null;
  agentLog: AgentLogEntry[] | null;
  agentTranscriptUrl: string | null;
  agentCostUsd: number | null;
  agentInputTokens: number | null;
  agentOutputTokens: number | null;
  agentProvider: string | null;
  inngestRunId: string | null;
  createdAt: string;
  updatedAt: string;
  images: ListingImage[];
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  creditTransaction: CreditTransaction | null;
}

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const res = await apiFetch(`/admin/listings/${id}`);

  if (!res.ok) {
    notFound();
  }

  const listing = (await res.json()) as ListingDetail;
  const originalImages = listing.images.filter((img) => img.type === "ORIGINAL");
  const enhancedImages = listing.images.filter((img) => img.type === "ENHANCED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/listings">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{listing.title ?? "Untitled Listing"}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className={STATUS_STYLES[listing.status] ?? ""}>
              {listing.status}
            </Badge>
            <Badge variant="outline" className={PIPELINE_STYLES[listing.pipelineStep] ?? ""}>
              {listing.pipelineStep}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {new Date(listing.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline Error Alert */}
      {listing.pipelineStep === "ERROR" && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <AlertTriangle size={20} />
              Pipeline Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              {listing.pipelineError ?? "Unknown error occurred during pipeline processing."}
            </p>
            {listing.creditTransaction && (
              listing.creditTransaction.type === "REFUND" ? (
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Credit refunded ({listing.creditTransaction.amount > 0 ? "+" : ""}
                  {listing.creditTransaction.amount} credit)
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No credit refund issued.
                </p>
              )
            )}
            {listing.agentTranscriptUrl && (
              <a
                href={listing.agentTranscriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-red-700 underline hover:no-underline dark:text-red-400"
              >
                View agent transcript <ExternalLink size={14} />
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Images */}
      {listing.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              {originalImages.length} original, {enhancedImages.length} enhanced
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {listing.images.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.blobUrl}
                    alt=""
                    className="aspect-square w-full rounded-md object-cover"
                  />
                  <Badge
                    variant="outline"
                    className="absolute bottom-1 left-1 bg-background/80 text-xs"
                  >
                    {img.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listing Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listing.description && (
              <p className="text-sm whitespace-pre-wrap">{listing.description}</p>
            )}
            {listing.rawDescription && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">User Input</p>
                <p className="mt-1 text-sm text-muted-foreground">{listing.rawDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {listing.suggestedPrice != null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Suggested Price</span>
                <span className="text-lg font-semibold">${listing.suggestedPrice.toFixed(2)}</span>
              </div>
            )}
            {(listing.priceRangeLow != null || listing.priceRangeHigh != null) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price Range</span>
                <span className="text-sm">
                  ${listing.priceRangeLow?.toFixed(2) ?? "?"} – ${listing.priceRangeHigh?.toFixed(2) ?? "?"}
                </span>
              </div>
            )}
            {listing.category && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm">{listing.category}</span>
              </div>
            )}
            {listing.condition && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Condition</span>
                <span className="text-sm">{listing.condition}</span>
              </div>
            )}
            {listing.brand && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Brand</span>
                <span className="text-sm">{listing.brand}</span>
              </div>
            )}
            {listing.model && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Model</span>
                <span className="text-sm">{listing.model}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparables */}
      {listing.comparables && listing.comparables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparable Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {listing.comparables.map((comp, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{comp.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {comp.source}
                      {comp.condition && ` · ${comp.condition}`}
                      {comp.soldDate && ` · Sold ${comp.soldDate}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">${comp.price.toFixed(2)}</span>
                    {comp.url && (
                      <a href={comp.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} className="text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Notes */}
      {listing.researchNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Research Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{listing.researchNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Admin-Only Section */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Details</CardTitle>
          <CardDescription>Processing metadata and costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* User */}
            <div className="flex items-start gap-3 rounded-md border p-3">
              <User size={18} className="mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">User</p>
                <Link
                  href={`/users/${listing.user.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {listing.user.name ?? listing.user.email}
                </Link>
              </div>
            </div>

            {/* Processing Cost */}
            <div className="flex items-start gap-3 rounded-md border p-3">
              <DollarSign size={18} className="mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Processing Cost</p>
                <p className="text-sm font-medium">
                  {listing.agentCostUsd != null
                    ? `$${listing.agentCostUsd.toFixed(4)}`
                    : "N/A"}
                </p>
                {(listing.agentInputTokens != null || listing.agentOutputTokens != null) && (
                  <p className="text-xs text-muted-foreground">
                    {listing.agentInputTokens?.toLocaleString() ?? 0} in /{" "}
                    {listing.agentOutputTokens?.toLocaleString() ?? 0} out tokens
                  </p>
                )}
              </div>
            </div>

            {/* Provider */}
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Cpu size={18} className="mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Agent Provider</p>
                <p className="text-sm font-medium">{listing.agentProvider ?? "N/A"}</p>
              </div>
            </div>

            {/* Credit Transaction */}
            <div className="flex items-start gap-3 rounded-md border p-3">
              <CreditCard size={18} className="mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Credit Transaction</p>
                {listing.creditTransaction ? (
                  <p className="text-sm font-medium">
                    {listing.creditTransaction.type} ({listing.creditTransaction.amount > 0 ? "+" : ""}
                    {listing.creditTransaction.amount})
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>
            </div>
          </div>

          {listing.agentTranscriptUrl && (
            <div className="mt-4">
              <a
                href={listing.agentTranscriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View full agent transcript <ExternalLink size={14} />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Log */}
      {listing.agentLog && listing.agentLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Log</CardTitle>
            <CardDescription>{listing.agentLog.length} entries</CardDescription>
          </CardHeader>
          <CardContent>
            <AgentLogViewer entries={listing.agentLog} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
