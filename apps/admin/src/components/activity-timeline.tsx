"use client";

import Link from "next/link";
import {
  UserPlus,
  LogIn,
  Package,
  Send,
  Search,
  BookOpen,
  Sparkles,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Coins,
  RefreshCw,
  Gift,
  ImagePlus,
  Image,
  ImageOff,
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  MinusCircle,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityEntry {
  id: string;
  userId: string;
  eventType: string;
  description: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

interface ActivityTimelineProps {
  activities: ActivityEntry[];
  showUser?: boolean;
}

const EVENT_ICONS: Record<string, LucideIcon> = {
  ACCOUNT_CREATED: UserPlus,
  LOGIN: LogIn,
  LISTING_CREATED: Package,
  LISTING_SUBMITTED: Send,
  PIPELINE_ANALYZING: Search,
  PIPELINE_RESEARCHING: BookOpen,
  PIPELINE_GENERATING: Sparkles,
  PIPELINE_COMPLETE: CheckCircle,
  PIPELINE_ERROR: AlertCircle,
  CREDITS_PURCHASED: CreditCard,
  CREDITS_USED: Coins,
  CREDITS_REFUNDED: RefreshCw,
  CREDITS_FREE_GRANT: Gift,
  IMAGE_ENHANCE_REQUESTED: ImagePlus,
  IMAGE_ENHANCE_COMPLETED: Image,
  IMAGE_ENHANCE_FAILED: ImageOff,
  ACCOUNT_SUSPENDED: ShieldAlert,
  ACCOUNT_UNSUSPENDED: ShieldCheck,
  MANUAL_CREDIT_GRANT: PlusCircle,
  MANUAL_CREDIT_DEDUCT: MinusCircle,
};

const EVENT_COLORS: Record<string, string> = {
  PIPELINE_ERROR: "text-destructive",
  IMAGE_ENHANCE_FAILED: "text-destructive",
  ACCOUNT_SUSPENDED: "text-destructive",
  PIPELINE_COMPLETE: "text-green-600",
  IMAGE_ENHANCE_COMPLETED: "text-green-600",
  ACCOUNT_UNSUSPENDED: "text-green-600",
  CREDITS_PURCHASED: "text-blue-600",
  MANUAL_CREDIT_GRANT: "text-blue-600",
  MANUAL_CREDIT_DEDUCT: "text-orange-600",
};

export function ActivityTimeline({
  activities,
  showUser = false,
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = EVENT_ICONS[activity.eventType] ?? Package;
            const colorClass = EVENT_COLORS[activity.eventType] ?? "text-muted-foreground";

            return (
              <div key={activity.id} className="flex gap-3">
                <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.eventType}
                    </Badge>
                    {showUser && activity.userName && (
                      <Link
                        href={`/users/${activity.userId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {activity.userName}
                      </Link>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                  {activity.resourceType && activity.resourceId && (
                    <Link
                      href={
                        activity.resourceType === "listing"
                          ? `/listings/${activity.resourceId}`
                          : "#"
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      {activity.resourceType}: {activity.resourceId}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
