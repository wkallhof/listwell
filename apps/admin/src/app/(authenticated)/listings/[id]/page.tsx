"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  MoreVertical,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { PipelineSteps } from "@/components/pipeline-steps";
import { AgentActivityLog } from "@/components/agent-activity-log";
import { ListingQuality } from "@/components/listing-quality";
import { formatListingForClipboard, type AgentLogEntry } from "@listwell/shared";

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
  parentImageId: string | null;
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
  status: "DRAFT" | "PROCESSING" | "READY" | "LISTED" | "SOLD" | "ARCHIVED";
  pipelineStep: string | null;
  pipelineError: string | null;
  agentLog: AgentLogEntry[] | null;
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

const POLL_INTERVAL_MS = 3000;

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [editingField, setEditingField] = useState<"title" | "description" | "price" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [enhancingImageId, setEnhancingImageId] = useState<string | null>(null);
  const [autoScrollToIndex, setAutoScrollToIndex] = useState<number | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const enhancePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleEnhance(imageId: string) {
    if (!listing) return;
    setEnhancingImageId(imageId);

    try {
      const response = await fetch(`/api/listings/${params.id}/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) {
        throw new Error("Enhancement request failed");
      }

      const previousImageCount = listing.images.length;

      enhancePollingRef.current = setInterval(async () => {
        const listingRes = await fetch(`/api/listings/${params.id}`);
        if (!listingRes.ok) return;

        const updated = await listingRes.json();
        if (updated.images.length > previousImageCount) {
          if (enhancePollingRef.current) {
            clearInterval(enhancePollingRef.current);
            enhancePollingRef.current = null;
          }
          setListing(updated);
          setEnhancingImageId(null);

          // Find the new enhanced image and scroll to it
          const sortedImages = [...updated.images].sort(
            (a: ListingImage, b: ListingImage) => a.sortOrder - b.sortOrder,
          );
          const newImageIndex = sortedImages.findIndex(
            (img: ListingImage) =>
              img.type === "ENHANCED" && img.parentImageId === imageId &&
              !listing.images.some((existing) => existing.id === img.id),
          );
          if (newImageIndex >= 0) {
            setAutoScrollToIndex(newImageIndex);
          }
          toast.success("Enhanced photo ready");
        }
      }, 3000);
    } catch {
      setEnhancingImageId(null);
      toast.error("Enhancement failed — try again");
    }
  }

  // Clean up enhance polling on unmount
  useEffect(() => {
    return () => {
      if (enhancePollingRef.current) {
        clearInterval(enhancePollingRef.current);
      }
    };
  }, []);

  function handleImageDelete(imageId: string) {
    setDeleteImageId(imageId);
  }

  async function confirmImageDelete() {
    if (!listing || !deleteImageId) return;
    setDeletingImage(true);

    const response = await fetch(
      `/api/listings/${params.id}/images?imageId=${deleteImageId}`,
      { method: "DELETE" },
    );

    if (response.ok) {
      setListing({
        ...listing,
        images: listing.images.filter((img) => img.id !== deleteImageId),
      });
      toast.success("Image deleted");
    } else {
      const data = await response.json().catch(() => null);
      toast.error(data?.error ?? "Failed to delete image");
    }

    setDeletingImage(false);
    setDeleteImageId(null);
  }

  function startEditing(field: "title" | "description" | "price") {
    if (!listing) return;
    if (field === "title") setEditValue(listing.title ?? "");
    else if (field === "description") setEditValue(listing.description ?? "");
    else if (field === "price") setEditValue(String(listing.suggestedPrice ?? ""));
    setEditingField(field);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  function cancelEditing() {
    setEditingField(null);
    setEditValue("");
  }

  async function saveEdit() {
    if (!listing || !editingField) return;

    const payload: Record<string, unknown> = {};
    if (editingField === "title") payload.title = editValue.trim();
    else if (editingField === "description") payload.description = editValue.trim();
    else if (editingField === "price") payload.suggestedPrice = Number(editValue) || null;

    setSaving(true);
    const response = await fetch(`/api/listings/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setListing({ ...listing, ...payload } as ListingDetail);
      toast.success("Changes saved");
    } else {
      toast.error("Failed to save changes");
    }
    setSaving(false);
    setEditingField(null);
    setEditValue("");
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") cancelEditing();
    if (e.key === "Enter" && editingField !== "description") saveEdit();
  }

  const fetchListing = useCallback(async () => {
    const response = await fetch(`/api/listings/${params.id}`);
    if (!response.ok) return null;
    return response.json();
  }, [params.id]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    fetchListing().then((data) => {
      if (cancelled) return;
      if (!data) {
        toast.error("Failed to load listing");
        router.push("/");
        return;
      }
      setListing(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchListing, router]);

  // Poll when processing
  useEffect(() => {
    const isProcessing =
      listing?.status === "PROCESSING" || listing?.status === "DRAFT";
    const isNotErrorOrComplete =
      listing?.pipelineStep !== "ERROR" && listing?.pipelineStep !== "COMPLETE";

    if (!isProcessing || !isNotErrorOrComplete) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(async () => {
      const data = await fetchListing();
      if (data) setListing(data);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [listing?.status, listing?.pipelineStep, fetchListing]);

  async function refreshListing() {
    const data = await fetchListing();
    if (data) setListing(data);
  }

  async function handleStatusUpdate(newStatus: string) {
    const response = await fetch(`/api/listings/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      toast.success(`Marked as ${newStatus.toLowerCase()}`);
      refreshListing();
    } else {
      toast.error("Failed to update listing");
    }
  }

  async function handleRetry() {
    setRetrying(true);
    const response = await fetch(`/api/listings/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "PROCESSING",
        pipelineStep: "PENDING",
        pipelineError: null,
        retry: true,
      }),
    });

    if (response.ok) {
      toast.info("Retrying listing generation...");
      await refreshListing();
    } else {
      toast.error("Failed to retry");
    }
    setRetrying(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const response = await fetch(`/api/listings/${params.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      toast.success("Listing deleted");
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
        <header className="flex items-center px-5 pb-2 pt-[max(env(safe-area-inset-top,0px)+0.25rem,1rem)]">
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

  const isProcessing =
    listing.status === "PROCESSING" ||
    (listing.status === "DRAFT" &&
      listing.pipelineStep !== "ERROR" &&
      // DRAFT + PENDING with no title = just submitted, awaiting agent pickup
      (listing.pipelineStep !== "PENDING" || !listing.title));
  const isError = listing.pipelineStep === "ERROR";
  const images = [...listing.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const primaryImage = images[0];

  // Processing / Error view
  if (isProcessing || isError) {
    return (
      <div className="min-h-svh px-5 pb-8 pt-[max(env(safe-area-inset-top,0px)+0.25rem,1rem)]">
        <header className="flex items-center pb-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="ml-2 text-lg font-semibold">
            {isError ? "Generation Failed" : "Generating..."}
          </h1>
        </header>

        {/* Photo Preview */}
        {primaryImage && (
          <div className="mb-6 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primaryImage.blobUrl}
              alt="Item photo"
              className="h-full w-full object-contain"
            />
          </div>
        )}

        {/* Pipeline Steps */}
        {!isError && (
          <>
            <Card>
              <CardContent className="py-4">
                <PipelineSteps currentStep={listing.pipelineStep ?? "PENDING"} />
              </CardContent>
            </Card>

            {listing.agentLog && listing.agentLog.length > 0 && (
              <AgentActivityLog entries={listing.agentLog} />
            )}
          </>
        )}

        {/* Error State */}
        {isError && (
          <Card className="border-destructive/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-destructive"
                />
                <div>
                  <p className="text-sm font-medium">Generation failed</p>
                  {listing.pipelineError && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {listing.pipelineError}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  {retrying ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Retrying...
                    </>
                  ) : (
                    "Retry"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isError && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            This usually takes 30–90 seconds
          </p>
        )}

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

  // Ready / Listed / Sold / Archived view
  const hasDetails =
    listing.brand || listing.model || listing.condition || listing.category;

  return (
    <div className="pb-28">
      <header className="flex items-center justify-between px-5 pb-2 pt-[max(env(safe-area-inset-top,0px)+0.25rem,1rem)]">
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
        <ImageCarousel
          images={images}
          onEnhance={handleEnhance}
          onDelete={handleImageDelete}
          enhancingImageId={enhancingImageId}
          scrollToIndex={autoScrollToIndex}
          onScrollComplete={() => setAutoScrollToIndex(null)}
        />
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
        {(listing.title || editingField === "title") && (
          <div>
            {editingField === "title" ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={editInputRef as React.RefObject<HTMLInputElement>}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="text-xl font-bold"
                  disabled={saving}
                />
                <Button variant="ghost" size="icon" onClick={saveEdit} disabled={saving} aria-label="Save">
                  <Check size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={cancelEditing} aria-label="Cancel">
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="group flex items-start justify-between gap-2">
                <h2
                  className="cursor-pointer text-xl font-bold leading-tight"
                  onClick={() => startEditing("title")}
                >
                  {listing.title}
                  <Pencil size={14} className="ml-2 inline opacity-0 group-hover:opacity-50" />
                </h2>
                <CopyButton text={listing.title!} label="title" />
              </div>
            )}
          </div>
        )}

        {/* Price Card */}
        {(listing.suggestedPrice != null || editingField === "price") && (
          <Card>
            <CardContent className="py-4">
              {editingField === "price" ? (
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">$</span>
                  <Input
                    ref={editInputRef as React.RefObject<HTMLInputElement>}
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="text-3xl font-bold"
                    disabled={saving}
                    min={0}
                  />
                  <Button variant="ghost" size="icon" onClick={saveEdit} disabled={saving} aria-label="Save price">
                    <Check size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelEditing} aria-label="Cancel price">
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-baseline justify-between">
                  <span
                    className="group cursor-pointer text-3xl font-bold"
                    onClick={() => startEditing("price")}
                  >
                    ${listing.suggestedPrice}
                    <Pencil size={14} className="ml-2 inline opacity-0 group-hover:opacity-50" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    suggested price
                  </span>
                </div>
              )}
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
        {(listing.description || editingField === "description") && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Description</h3>
              {editingField === "description" ? (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={saveEdit} disabled={saving} aria-label="Save description">
                    <Check size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelEditing} aria-label="Cancel description">
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <CopyButton text={listing.description!} label="description" />
              )}
            </div>
            {editingField === "description" ? (
              <Textarea
                ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="min-h-[120px] resize-none text-sm"
                disabled={saving}
              />
            ) : (
              <div
                className="group cursor-pointer whitespace-pre-wrap text-sm leading-relaxed text-foreground"
                onClick={() => startEditing("description")}
              >
                {listing.description}
                <Pencil size={14} className="ml-2 inline opacity-0 group-hover:opacity-50" />
              </div>
            )}
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
            <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-muted-foreground">
              <ReactMarkdown>{listing.researchNotes}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Listing Quality Checklist */}
        <ListingQuality
          photoCount={listing.images.filter((img) => img.type === "ORIGINAL").length}
          description={listing.description}
          suggestedPrice={listing.suggestedPrice}
          comparablesCount={listing.comparables?.length ?? 0}
          brand={listing.brand}
          condition={listing.condition}
          researchNotes={listing.researchNotes}
        />
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

      {/* Image Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteImageId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteImageId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This image will be permanently removed from the listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmImageDelete}
              disabled={deletingImage}
            >
              {deletingImage ? (
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
