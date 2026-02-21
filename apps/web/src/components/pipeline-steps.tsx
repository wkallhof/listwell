"use client";

import { CheckCircle, Circle, Loader2 } from "lucide-react";

const STEPS = [
  { key: "ANALYZING", label: "Analyzing photos" },
  { key: "RESEARCHING", label: "Researching prices" },
  { key: "GENERATING", label: "Writing listing" },
  { key: "COMPLETE", label: "Finishing up" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

type StepState = "completed" | "active" | "pending";

function getStepState(stepKey: StepKey, currentStep: string): StepState {
  const stepOrder: Record<string, number> = {
    PENDING: 0,
    ANALYZING: 1,
    RESEARCHING: 2,
    GENERATING: 3,
    COMPLETE: 4,
  };

  const currentIndex = stepOrder[currentStep] ?? 0;
  const stepIndex = stepOrder[stepKey] ?? 0;

  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex && currentStep !== "PENDING") return "active";
  return "pending";
}

interface StepIconProps {
  state: StepState;
}

function StepIcon({ state }: StepIconProps) {
  if (state === "completed") {
    return <CheckCircle size={20} className="text-emerald-500" />;
  }
  if (state === "active") {
    return <Loader2 size={20} className="animate-spin text-primary" />;
  }
  return <Circle size={20} className="text-muted-foreground/30" />;
}

export interface PipelineStepsProps {
  currentStep: string;
}

export function PipelineSteps({ currentStep }: PipelineStepsProps) {
  return (
    <div className="space-y-4">
      {STEPS.map((step) => {
        const state = getStepState(step.key, currentStep);
        return (
          <div key={step.key} className="flex items-center gap-3">
            <StepIcon state={state} />
            <span
              className={
                state === "active"
                  ? "text-sm font-medium text-foreground"
                  : state === "completed"
                    ? "text-sm text-muted-foreground"
                    : "text-sm text-muted-foreground/50"
              }
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
