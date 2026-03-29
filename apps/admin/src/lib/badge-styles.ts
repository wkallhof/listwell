export const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PROCESSING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  READY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  LISTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SOLD: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export const PIPELINE_STYLES: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  ANALYZING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESEARCHING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  GENERATING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  COMPLETE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};
