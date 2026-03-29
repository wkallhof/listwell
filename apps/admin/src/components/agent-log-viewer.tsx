"use client";

import { useState } from "react";
import type { AgentLogEntry } from "@listwell/shared";
import {
  Search,
  Globe,
  FileText,
  PenLine,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentLogViewerProps {
  entries: AgentLogEntry[];
}

const TYPE_CONFIG: Record<
  AgentLogEntry["type"],
  { icon: React.ElementType; label: string; className: string }
> = {
  status: { icon: Activity, label: "Status", className: "text-blue-600 dark:text-blue-400" },
  search: { icon: Search, label: "Search", className: "text-purple-600 dark:text-purple-400" },
  fetch: { icon: Globe, label: "Fetch", className: "text-indigo-600 dark:text-indigo-400" },
  text: { icon: FileText, label: "Text", className: "text-muted-foreground" },
  write: { icon: PenLine, label: "Write", className: "text-amber-600 dark:text-amber-400" },
  complete: { icon: CheckCircle2, label: "Complete", className: "text-green-600 dark:text-green-400" },
  error: { icon: AlertCircle, label: "Error", className: "text-red-600 dark:text-red-400" },
};

export function AgentLogViewer({ entries }: AgentLogViewerProps) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No agent log entries.</p>
    );
  }

  const toggleEntry = (index: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {entries.map((entry, index) => {
        const config = TYPE_CONFIG[entry.type];
        const Icon = config.icon;
        const isExpanded = expandedIndices.has(index);
        const isLong = entry.content.length > 120;

        return (
          <div
            key={index}
            className="rounded-md border px-3 py-2"
          >
            <button
              type="button"
              className="flex w-full items-start gap-2 text-left"
              onClick={() => isLong && toggleEntry(index)}
            >
              <Icon size={16} className={cn("mt-0.5 shrink-0", config.className)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium", config.className)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(entry.ts)}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-0.5 text-sm",
                    !isExpanded && isLong && "line-clamp-2",
                  )}
                >
                  {entry.content}
                </p>
              </div>
              {isLong && (
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
