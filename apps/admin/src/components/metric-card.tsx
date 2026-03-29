import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "primary" | "success" | "destructive";
}

const variantStyles: Record<NonNullable<MetricCardProps["variant"]>, string> = {
  default: "",
  primary: "border-primary/20 bg-primary/5",
  success: "border-green-500/20 bg-green-500/5",
  destructive: "border-destructive/20 bg-destructive/5",
};

export function MetricCard({
  label,
  value,
  description,
  trend,
  variant = "default",
}: MetricCardProps) {
  return (
    <Card className={cn("py-4", variantStyles[variant])}>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && trend !== "neutral" && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {trend === "up" ? "↑" : "↓"}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
