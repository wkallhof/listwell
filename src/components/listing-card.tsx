"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingStatusBadge } from "@/components/listing-status-badge";

interface ListingCardProps {
  id: string;
  title: string | null;
  status: "DRAFT" | "PROCESSING" | "READY" | "LISTED" | "SOLD" | "ARCHIVED";
  suggestedPrice: number | null;
  pipelineStep: string | null;
  createdAt: string;
  primaryImageUrl: string | null;
}

const PIPELINE_LABELS: Record<string, string> = {
  PENDING: "Starting...",
  ANALYZING: "Analyzing photos",
  RESEARCHING: "Researching prices",
  GENERATING: "Writing listing",
  COMPLETE: "Finishing up",
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000,
  );

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ListingCard({
  id,
  title,
  status,
  suggestedPrice,
  pipelineStep,
  createdAt,
  primaryImageUrl,
}: ListingCardProps) {
  const isProcessing = status === "PROCESSING";
  const showPrice = suggestedPrice && !isProcessing;

  return (
    <Link href={`/listings/${id}`}>
      <Card className="overflow-hidden">
        <div className="flex gap-3 p-3">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {primaryImageUrl ? (
              <img
                src={primaryImageUrl}
                alt={title ?? "Listing image"}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`truncate text-base font-medium ${
                  isProcessing
                    ? "italic text-muted-foreground"
                    : ""
                }`}
              >
                {isProcessing ? "Processing..." : title ?? "Untitled"}
              </p>
              <ListingStatusBadge status={status} />
            </div>

            {showPrice && (
              <p className="text-lg font-semibold">
                ${Math.round(suggestedPrice)}
              </p>
            )}

            {isProcessing && pipelineStep && (
              <div className="mt-1 flex items-center gap-1.5">
                <Loader2
                  size={14}
                  className="animate-spin text-amber-600"
                />
                <span className="text-xs text-muted-foreground">
                  {PIPELINE_LABELS[pipelineStep] ?? pipelineStep}
                </span>
              </div>
            )}

            <p className="mt-1 text-xs text-muted-foreground">
              {timeAgo(createdAt)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
