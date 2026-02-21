import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImagePlus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={ImagePlus}
        title="No listings yet"
        description="Tap + to create your first one"
      />,
    );

    expect(screen.getByText("No listings yet")).toBeInTheDocument();
    expect(
      screen.getByText("Tap + to create your first one"),
    ).toBeInTheDocument();
  });

  it("renders the icon", () => {
    const { container } = render(
      <EmptyState
        icon={ImagePlus}
        title="Empty"
        description="Nothing here"
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("centers content vertically", () => {
    const { container } = render(
      <EmptyState
        icon={ImagePlus}
        title="Empty"
        description="Nothing here"
      />,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("items-center");
    expect(wrapper?.className).toContain("justify-center");
    expect(wrapper?.className).toContain("text-center");
  });
});
