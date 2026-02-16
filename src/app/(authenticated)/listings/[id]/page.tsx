"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageCarousel } from "@/components/image-carousel";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { CopyButton } from "@/components/copy-button";
import { BottomBar } from "@/components/bottom-bar";
import { formatListingForClipboard } from "@/lib/listing-formatter";

interface Comparable {
  title: string;
  price: number;
  source: string;
  url?: string;
}

interface ListingImage {
  id: string;
  blobUrl: string;
  type: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface ListingDetail {
  id: string;
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
  status: "DRAFT" | "PROCESSING" | "READY" | "LISTED" | "SOLD" | "ARCHIVED" | "ERROR";
  pipelineStep: string | null;
  pipelineError: string | null;
  createdAt: string;
  images: ListingImage[];
}

interface DetailRowProps {
  label: string;
  value: string | null;
}

function DetailRow({ label, value }: DetailRowProps) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="block text-sm font-medium">{value}</span>
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchListing = useCallback(async () => {
    const response = await fetch(`/api/listings/${params.id}`);
    if (!response.ok) {
      toast.error("Failed to load listing");
      router.push("/");
      return;
    }
    const data = await response.json();
    setListing(data);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  async function handleStatusUpdate(newStatus: string) {
    const response = await fetch(`/api/listings/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      toast.info(`Listing marked as ${newStatus.toLowerCase()}`);
      fetchListing();
    } else {
      toast.error("Failed to update listing");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const response = await fetch(`/api/listings/${params.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      toast.info("Listing deleted");
      router.push("/");
    } else {
      toast.error("Failed to delete listing");
      setDeleting(false);
    }
  }

  function handleCopyFullListing() {
    if (!listing) return;

    const text = formatListingForClipboard(listing);
    navigator.clipboard.writeText(text);
    toast.success("Listing copied to clipboard");
  }

  if (loading) {
    return (
      <div className="pb-28">
        <header className="flex items-center px-5 pb-2 pt-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft size={20} />
          </Button>
        </header>
        <div className="px-5">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="mt-4 h-6 w-32" />
          <Skeleton className="mt-2 h-10 w-48" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const images = [...listing.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const hasDetails = listing.brand || listing.model || listing.condition || listing.category;

  return (
    <div className="pb-28">
      <header className="flex items-center justify-between px-5 pb-2 pt-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft size={20} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {listing.status === "READY" && (
              <DropdownMenuItem onClick={() => handleStatusUpdate("LISTED")}>
                Mark as Listed
              </DropdownMenuItem>
            )}
            {listing.status === "LISTED" && (
              <DropdownMenuItem onClick={() => handleStatusUpdate("SOLD")}>
                Mark as Sold
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleStatusUpdate("ARCHIVED")}>
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Delete Listing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Image Carousel */}
      <div className="px-5">
        <ImageCarousel images={images} />
      </div>

      <div className="mt-4 space-y-5 px-5">
        {/* Status Badge Row */}
        <div className="flex items-center gap-2">
          <ListingStatusBadge status={listing.status} />
          {listing.category && (
            <span className="text-xs text-muted-foreground">
              {listing.category}
            </span>
          )}
        </div>

        {/* Title Section */}
        {listing.title && (
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold leading-tight">
              {listing.title}
            </h2>
            <CopyButton text={listing.title} label="title" />
          </div>
        )}

        {/* Price Card */}
        {listing.suggestedPrice != null && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">
                  ${listing.suggestedPrice}
                </span>
                <span className="text-xs text-muted-foreground">
                  suggested price
                </span>
              </div>
              {listing.priceRangeLow != null &&
                listing.priceRangeHigh != null && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">
                      Market range: ${listing.priceRangeLow} – $
                      {listing.priceRangeHigh}
                    </span>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Description Section */}
        {listing.description && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Description</h3>
              <CopyButton text={listing.description} label="description" />
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {listing.description}
            </div>
          </div>
        )}

        {/* Product Details */}
        {hasDetails && (
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <DetailRow label="Brand" value={listing.brand} />
                <DetailRow label="Model" value={listing.model} />
                <DetailRow label="Condition" value={listing.condition} />
                <DetailRow label="Category" value={listing.category} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparable Listings */}
        {listing.comparables && listing.comparables.length > 0 && (
          <div>
            <h3 className="mb-3 text-lg font-semibold">Market Comparables</h3>
            <div className="space-y-2">
              {listing.comparables.map((comp, index) => (
                <Card key={index}>
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {comp.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {comp.source}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">${comp.price}</p>
                        {comp.url && (
                          <a
                            href={comp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink
                              size={14}
                              className="text-muted-foreground"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Market Notes */}
        {listing.researchNotes && (
          <div>
            <h3 className="mb-2 text-lg font-semibold">Market Notes</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {listing.researchNotes}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <BottomBar>
        <Button className="h-11 w-full" onClick={handleCopyFullListing}>
          <Copy size={16} />
          Copy Full Listing
        </Button>
      </BottomBar>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the listing and all its images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
