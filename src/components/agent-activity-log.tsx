"use client";

import { useEffect, useRef } from "react";
import { Globe, MessageSquare, Search, FileText, CheckCircle, AlertCircle, Activity } from "lucide-react";
import type { AgentLogEntry } from "@/types";

function formatRelativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

const ICON_MAP: Record<AgentLogEntry["type"], typeof Search> = {
  status: Activity,
  search: Search,
  fetch: Globe,
  text: MessageSquare,
  write: FileText,
  complete: CheckCircle,
  error: AlertCircle,
};

export interface AgentActivityLogProps {
  entries: AgentLogEntry[];
}

export function AgentActivityLog({ entries }: AgentActivityLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      ref={scrollRef}
      className="mt-4 max-h-48 overflow-y-auto rounded-lg bg-muted/50 p-3"
      data-testid="agent-activity-log"
    >
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const Icon = ICON_MAP[entry.type];
          return (
            <div
              key={`${entry.ts}-${index}`}
              className="flex items-start gap-2"
            >
              <Icon
                size={14}
                className={
                  entry.type === "error"
                    ? "mt-0.5 shrink-0 text-destructive"
                    : entry.type === "complete"
                      ? "mt-0.5 shrink-0 text-emerald-500"
                      : "mt-0.5 shrink-0 text-muted-foreground"
                }
              />
              <span className="min-w-0 flex-1 break-words text-xs text-foreground">
                {entry.content}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeTime(entry.ts)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
