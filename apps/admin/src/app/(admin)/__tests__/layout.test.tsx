import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminLayout from "../layout";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("AdminLayout", () => {
  it("renders sidebar and children", () => {
    render(
      <AdminLayout>
        <div data-testid="child-content">Test content</div>
      </AdminLayout>,
    );

    expect(screen.getByText("Listwell")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });
});
