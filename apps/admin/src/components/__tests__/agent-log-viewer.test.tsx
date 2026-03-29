import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentLogViewer } from "../agent-log-viewer";

describe("AgentLogViewer", () => {
  const mockEntries = [
    { ts: 1709300000, type: "status" as const, content: "Analyzing images..." },
    { ts: 1709300005, type: "search" as const, content: "Searching for comparable items" },
    { ts: 1709300010, type: "fetch" as const, content: "Fetching price data from eBay" },
    { ts: 1709300015, type: "text" as const, content: "Generating listing description" },
    { ts: 1709300020, type: "write" as const, content: "Writing final output" },
    { ts: 1709300025, type: "complete" as const, content: "Done" },
  ];

  it("should render all log entries", () => {
    render(<AgentLogViewer entries={mockEntries} />);

    expect(screen.getByText("Analyzing images...")).toBeInTheDocument();
    expect(screen.getByText("Searching for comparable items")).toBeInTheDocument();
    expect(screen.getByText("Fetching price data from eBay")).toBeInTheDocument();
    expect(screen.getByText("Generating listing description")).toBeInTheDocument();
    expect(screen.getByText("Writing final output")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("should render type labels", () => {
    render(<AgentLogViewer entries={mockEntries} />);

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Fetch")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Write")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("should render error type entries", () => {
    render(
      <AgentLogViewer
        entries={[{ ts: 1709300000, type: "error", content: "Something went wrong" }]}
      />,
    );

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should show empty state when no entries", () => {
    render(<AgentLogViewer entries={[]} />);

    expect(screen.getByText("No agent log entries.")).toBeInTheDocument();
  });

  it("should expand long entries on click", async () => {
    const user = userEvent.setup();
    const longContent = "A".repeat(200);

    render(
      <AgentLogViewer
        entries={[{ ts: 1709300000, type: "text", content: longContent }]}
      />,
    );

    // Should have line-clamp applied initially
    const button = screen.getByRole("button");
    const paragraph = button.querySelector("p");
    expect(paragraph?.className).toContain("line-clamp-2");

    // Click to expand
    await user.click(button);

    const expandedParagraph = screen.getByRole("button").querySelector("p");
    expect(expandedParagraph?.className).not.toContain("line-clamp-2");
  });

  it("should not show expand controls for short entries", () => {
    render(
      <AgentLogViewer
        entries={[{ ts: 1709300000, type: "status", content: "Short" }]}
      />,
    );

    // Short entries still have a button wrapper but no chevron icon
    const button = screen.getByRole("button");
    expect(button.querySelector("p")?.className).not.toContain("line-clamp");
  });
});
