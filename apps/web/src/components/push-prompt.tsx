"use client";

import { useCallback, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DISMISSED_KEY = "listwell-push-dismissed";

function shouldShowPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "default") return false;
  if (localStorage.getItem(DISMISSED_KEY)) return false;
  return true;
}

export function PushPrompt() {
  const [dismissed, setDismissed] = useState(false);

  const handleEnable = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setDismissed(true);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("Push notifications not configured");
        setDismissed(true);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      const subJson = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
        }),
      });

      if (res.ok) {
        toast.success("Notifications enabled!");
      } else {
        toast.error("Failed to enable notifications");
      }
    } catch {
      toast.error("Failed to enable notifications");
    }
    setDismissed(true);
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }, []);

  if (dismissed || !shouldShowPrompt()) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-start gap-3 py-4">
        <Bell size={20} className="mt-0.5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            Get notified when listings are ready
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We&apos;ll send a push notification when your AI listing is
            complete.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleEnable}>
              Enable
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </CardContent>
    </Card>
  );
}
