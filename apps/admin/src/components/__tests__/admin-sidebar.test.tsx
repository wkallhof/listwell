import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminSidebar } from "../admin-sidebar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("AdminSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all navigation links", () => {
    render(<AdminSidebar collapsed={false} onToggle={vi.fn()} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Listings")).toBeInTheDocument();
    expect(screen.getByText("Revenue & Costs")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });

  it("should render Listwell brand name", () => {
    render(<AdminSidebar collapsed={false} onToggle={vi.fn()} />);

    expect(screen.getByText("Listwell")).toBeInTheDocument();
  });

  it("should hide labels when collapsed", () => {
    render(<AdminSidebar collapsed={true} onToggle={vi.fn()} />);

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Listwell")).not.toBeInTheDocument();
  });

  it("should call onToggle when toggle button is clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<AdminSidebar collapsed={false} onToggle={onToggle} />);

    await user.click(screen.getByLabelText("Collapse sidebar"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("should render logout button", () => {
    render(<AdminSidebar collapsed={false} onToggle={vi.fn()} />);

    expect(screen.getByText("Log out")).toBeInTheDocument();
  });

  it("should highlight active nav item", async () => {
    const navigation = await import("next/navigation");
    vi.mocked(navigation.usePathname).mockReturnValue("/users");

    render(<AdminSidebar collapsed={false} onToggle={vi.fn()} />);

    const usersLink = screen.getByText("Users").closest("a");
    expect(usersLink?.className).toContain("text-primary");
  });
});
