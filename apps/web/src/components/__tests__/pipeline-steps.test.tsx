import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PipelineSteps } from "@/components/pipeline-steps";

describe("PipelineSteps", () => {
  const stepLabels = [
    "Analyzing photos",
    "Researching prices",
    "Writing listing",
    "Finishing up",
  ];

  it("renders all four step labels", () => {
    render(<PipelineSteps currentStep="PENDING" />);
    for (const label of stepLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("shows all steps as pending when currentStep is PENDING", () => {
    const { container } = render(<PipelineSteps currentStep="PENDING" />);
    const spinners = container.querySelectorAll(".animate-spin");
    expect(spinners).toHaveLength(0);

    for (const label of stepLabels) {
      const el = screen.getByText(label);
      expect(el.className).toContain("text-muted-foreground/50");
    }
  });

  it("shows ANALYZING as active and others as pending when currentStep is ANALYZING", () => {
    const { container } = render(<PipelineSteps currentStep="ANALYZING" />);
    const spinners = container.querySelectorAll(".animate-spin");
    expect(spinners).toHaveLength(1);

    expect(screen.getByText("Analyzing photos").className).toContain("font-medium");
    expect(screen.getByText("Researching prices").className).toContain("text-muted-foreground/50");
  });

  it("shows completed steps before active step when currentStep is RESEARCHING", () => {
    const { container } = render(<PipelineSteps currentStep="RESEARCHING" />);
    const checkIcons = container.querySelectorAll(".text-emerald-500");
    expect(checkIcons).toHaveLength(1);

    expect(screen.getByText("Researching prices").className).toContain("font-medium");

    const spinners = container.querySelectorAll(".animate-spin");
    expect(spinners).toHaveLength(1);
  });

  it("shows two completed steps and active GENERATING when currentStep is GENERATING", () => {
    const { container } = render(<PipelineSteps currentStep="GENERATING" />);
    const checkIcons = container.querySelectorAll(".text-emerald-500");
    expect(checkIcons).toHaveLength(2);
    const writing = screen.getByText("Writing listing");
    expect(writing.className).toContain("font-medium");
  });

  it("shows first three steps completed and COMPLETE as active when currentStep is COMPLETE", () => {
    const { container } = render(<PipelineSteps currentStep="COMPLETE" />);
    const checkIcons = container.querySelectorAll(".text-emerald-500");
    expect(checkIcons).toHaveLength(3);

    const spinners = container.querySelectorAll(".animate-spin");
    expect(spinners).toHaveLength(1);

    expect(screen.getByText("Finishing up").className).toContain("font-medium");
  });

  it("handles unknown currentStep gracefully by treating all as pending", () => {
    const { container } = render(<PipelineSteps currentStep="UNKNOWN" />);
    const spinners = container.querySelectorAll(".animate-spin");
    expect(spinners).toHaveLength(0);
    const checkIcons = container.querySelectorAll(".text-emerald-500");
    expect(checkIcons).toHaveLength(0);
  });

  it("applies completed text style to completed steps", () => {
    render(<PipelineSteps currentStep="GENERATING" />);
    const analyzing = screen.getByText("Analyzing photos");
    expect(analyzing.className).toContain("text-muted-foreground");
    expect(analyzing.className).not.toContain("text-muted-foreground/50");
  });
});
