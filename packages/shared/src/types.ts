// Shared TypeScript types

export interface AgentLogEntry {
  ts: number;
  type: "status" | "search" | "fetch" | "text" | "write" | "complete" | "error";
  content: string;
}
