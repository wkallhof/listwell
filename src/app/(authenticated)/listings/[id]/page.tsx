"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
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
  const [editingField, setEditingField] = useState<"title" | "description" | "price" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

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

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/listings/${params.id}`)
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          toast.error("Failed to load listing");
          router.push("/");
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          setListing(data);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function refreshListing() {
    const response = await fetch(`/api/listings/${params.id}`);
    if (response.ok) {
      const data = await response.json();
      setListing(data);
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    const response = await fetch(`/api/listings/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      toast.info(`Listing marked as ${newStatus.toLowerCase()}`);
      refreshListing();
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
