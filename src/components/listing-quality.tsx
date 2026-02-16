"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ListingQualityProps {
  photoCount: number;
  description: string | null;
  suggestedPrice: number | null;
  comparablesCount: number;
  brand: string | null;
  condition: string | null;
  researchNotes: string | null;
}

interface QualityCheck {
  label: string;
  passed: boolean;
}

function getDescriptionWordCount(description: string | null): number {
  if (!description) return 0;
  return description.trim().split(/\s+/).filter(Boolean).length;
}

export function evaluateListingQuality(props: ListingQualityProps): {
  checks: QualityCheck[];
  score: number;
  total: number;
} {
  const descWordCount = getDescriptionWordCount(props.description);

  const checks: QualityCheck[] = [
    {
      label: "At least 2 photos",
      passed: props.photoCount >= 2,
    },
    {
      label: "Description 80+ words",
      passed: descWordCount >= 80,
    },
    {
      label: "Price researched",
      passed: props.suggestedPrice !== null && props.comparablesCount > 0,
    },
    {
      label: "Brand identified",
      passed: !!props.brand,
    },
    {
      label: "Condition assessed",
      passed: !!props.condition,
    },
    {
      label: "Market notes included",
      passed: !!props.researchNotes,
    },
  ];

  const score = checks.filter((c) => c.passed).length;
  return { checks, score, total: checks.length };
}

export function ListingQuality(props: ListingQualityProps) {
  const { checks, score, total } = evaluateListingQuality(props);

  const percentage = Math.round((score / total) * 100);
  const isComplete = score === total;

  function getScoreColor(): string {
    if (isComplete) return "text-emerald-600 dark:text-emerald-400";
    if (percentage >= 67) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Listing Quality</h3>
          <span className={`text-sm font-semibold ${getScoreColor()}`}>
            {`${score}/${total}`}
          </span>
        </div>
        <div className="space-y-2">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-2">
              {check.passed ? (
                <CheckCircle2
                  size={16}
                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                />
              ) : (
                <Circle
                  size={16}
                  className="shrink-0 text-muted-foreground/40"
                />
              )}
              <span
                className={
                  check.passed ? "text-sm text-foreground" : "text-sm text-muted-foreground"
                }
              >
                {check.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
