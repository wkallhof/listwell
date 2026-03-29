import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { GlobalActivityClient } from "../global-activity-client";

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
    userName: "Alice Smith",
    userEmail: "alice@example.com",
  },
  {
    id: "act2",
    userId: "u2",
    eventType: "LISTING_CREATED",
    description: "Created listing with 2 images",
    resourceType: "listing",
    resourceId: "l1",
    metadata: null,
    createdAt: "2026-03-01T13:00:00Z",
    userName: "Bob Jones",
    userEmail: "bob@example.com",
  },
];

const mockPagination = { page: 1, limit: 30, total: 2, totalPages: 1 };

describe("GlobalActivityClient", () => {
  it("renders activity timeline with user names", () => {
    render(
      <GlobalActivityClient
        activities={mockActivities}
        pagination={mockPagination}
        currentEventType=""
      />,
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders event type filter", () => {
    render(
      <GlobalActivityClient
        activities={mockActivities}
        pagination={mockPagination}
        currentEventType=""
      />,
    );
    expect(screen.getByLabelText("Filter by event type")).toBeInTheDocument();
  });

  it("renders event descriptions", () => {
    render(
      <GlobalActivityClient
        activities={mockActivities}
        pagination={mockPagination}
        currentEventType=""
      />,
    );
    expect(screen.getByText("User signed in")).toBeInTheDocument();
    expect(screen.getByText("Created listing with 2 images")).toBeInTheDocument();
  });

  it("shows pagination when multiple pages", () => {
    render(
      <GlobalActivityClient
        activities={mockActivities}
        pagination={{ page: 1, limit: 30, total: 60, totalPages: 2 }}
        currentEventType=""
      />,
    );
    expect(screen.getByText("60 total events")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("hides pagination when single page", () => {
    render(
      <GlobalActivityClient
        activities={mockActivities}
        pagination={mockPagination}
        currentEventType=""
      />,
    );
    expect(screen.queryByText("Page 1 of 1")).not.toBeInTheDocument();
  });

  it("renders resource links", () => {
    render(
      <GlobalActivityClient
        activities={mockActivities}
        pagination={mockPagination}
        currentEventType=""
      />,
    );
    const link = screen.getByText("listing: l1").closest("a");
    expect(link).toHaveAttribute("href", "/listings/l1");
  });
});
