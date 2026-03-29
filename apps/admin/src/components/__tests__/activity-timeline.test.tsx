import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ActivityTimeline } from "../activity-timeline";

const mockActivities = [
  {
    id: "act1",
    userId: "u1",
    eventType: "LOGIN",
    description: "User signed in",
    resourceType: null,
    resourceId: null,
    metadata: null,
    createdAt: "2026-03-01T12:00:00Z",
  },
  {
    id: "act2",
    userId: "u1",
    eventType: "LISTING_CREATED",
    description: "Created listing with 3 images",
    resourceType: "listing",
    resourceId: "l1",
    metadata: null,
    createdAt: "2026-03-01T13:00:00Z",
  },
  {
    id: "act3",
    userId: "u2",
    eventType: "PIPELINE_ERROR",
    description: "Pipeline failed: timeout",
    resourceType: "listing",
    resourceId: "l2",
    metadata: null,
    createdAt: "2026-03-01T14:00:00Z",
    userName: "Bob Jones",
    userEmail: "bob@example.com",
  },
];

describe("ActivityTimeline", () => {
  it("renders 'No activity yet' when empty", () => {
    render(<ActivityTimeline activities={[]} />);
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });

  it("renders activity entries with event type badges", () => {
    render(<ActivityTimeline activities={mockActivities} />);
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
    expect(screen.getByText("LISTING_CREATED")).toBeInTheDocument();
    expect(screen.getByText("PIPELINE_ERROR")).toBeInTheDocument();
  });

  it("renders descriptions", () => {
    render(<ActivityTimeline activities={mockActivities} />);
    expect(screen.getByText("User signed in")).toBeInTheDocument();
    expect(screen.getByText("Created listing with 3 images")).toBeInTheDocument();
  });

  it("renders resource links for entries with resourceType", () => {
    render(<ActivityTimeline activities={mockActivities} />);
    const link = screen.getByText("listing: l1").closest("a");
    expect(link).toHaveAttribute("href", "/listings/l1");
  });

  it("shows user name when showUser is true", () => {
    render(<ActivityTimeline activities={mockActivities} showUser />);
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("does not show user name when showUser is false", () => {
    render(<ActivityTimeline activities={mockActivities} showUser={false} />);
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
  });
});
