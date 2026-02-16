import { AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ListingStatus =
  | "DRAFT"
  | "PROCESSING"
  | "READY"
  | "LISTED"
  | "SOLD"
  | "ARCHIVED"
  | "ERROR";

interface ListingStatusBadgeProps {
  status: ListingStatus;
}

const statusConfig: Record<
  ListingStatus,
  { label: string; className: string; icon?: "loader" | "alert" }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-secondary text-secondary-foreground",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: "loader",
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  LISTED: {
    label: "Listed",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  SOLD: {
    label: "Sold",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-secondary text-muted-foreground",
  },
  ERROR: {
    label: "Error",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: "alert",
  },
};

export function ListingStatusBadge({ status }: ListingStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={`gap-1 ${config.className}`}>
      {config.icon === "loader" && (
        <Loader2 size={12} className="animate-spin" />
      )}
      {config.icon === "alert" && <AlertCircle size={12} />}
      {config.label}
    </Badge>
  );
}
