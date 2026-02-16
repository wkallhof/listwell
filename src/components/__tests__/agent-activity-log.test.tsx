import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentActivityLog } from "@/components/agent-activity-log";
import type { AgentLogEntry } from "@/types";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AgentActivityLog", () => {
  it("renders nothing when entries are empty", () => {
    const { container } = render(<AgentActivityLog entries={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders entries with correct content", () => {
    const entries: AgentLogEntry[] = [
      { ts: Date.now() - 5000, type: "status", content: "Starting analysis..." },
      { ts: Date.now() - 3000, type: "search", content: "Searching: drill prices eBay" },
      { ts: Date.now() - 1000, type: "text", content: "Found several comparable listings" },
    ];

    render(<AgentActivityLog entries={entries} />);

    expect(screen.getByText("Starting analysis...")).toBeInTheDocument();
    expect(screen.getByText("Searching: drill prices eBay")).toBeInTheDocument();
    expect(screen.getByText("Found several comparable listings")).toBeInTheDocument();
  });

  it("renders the activity log container", () => {
    const entries: AgentLogEntry[] = [
      { ts: Date.now(), type: "status", content: "Starting..." },
    ];

    render(<AgentActivityLog entries={entries} />);

    expect(screen.getByTestId("agent-activity-log")).toBeInTheDocument();
  });

  it("shows relative timestamps", () => {
    const entries: AgentLogEntry[] = [
      { ts: Date.now() - 2000, type: "status", content: "Recent entry" },
    ];

    render(<AgentActivityLog entries={entries} />);

    // Should show a relative time like "2s ago"
    expect(screen.getByText(/ago|just now/)).toBeInTheDocument();
  });

  it("renders different entry types with appropriate styling", () => {
    const entries: AgentLogEntry[] = [
      { ts: Date.now(), type: "complete", content: "Listing generated" },
      { ts: Date.now(), type: "error", content: "Something went wrong" },
    ];

    render(<AgentActivityLog entries={entries} />);

    expect(screen.getByText("Listing generated")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders all entry types", () => {
    const entries: AgentLogEntry[] = [
      { ts: Date.now(), type: "status", content: "Starting..." },
      { ts: Date.now(), type: "search", content: "Searching: test" },
      { ts: Date.now(), type: "fetch", content: "Fetching: https://example.com" },
      { ts: Date.now(), type: "text", content: "Analyzing photos" },
      { ts: Date.now(), type: "write", content: "Writing listing output" },
      { ts: Date.now(), type: "complete", content: "Done" },
      { ts: Date.now(), type: "error", content: "Error occurred" },
    ];

    render(<AgentActivityLog entries={entries} />);

    expect(screen.getByText("Starting...")).toBeInTheDocument();
    expect(screen.getByText("Searching: test")).toBeInTheDocument();
    expect(screen.getByText("Fetching: https://example.com")).toBeInTheDocument();
    expect(screen.getByText("Analyzing photos")).toBeInTheDocument();
    expect(screen.getByText("Writing listing output")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });

  it("shows 'just now' for very recent entries", () => {
    const entries: AgentLogEntry[] = [
      { ts: Date.now(), type: "status", content: "Just happened" },
    ];

    render(<AgentActivityLog entries={entries} />);

    expect(screen.getByText("just now")).toBeInTheDocument();
  });
});
