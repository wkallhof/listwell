"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface SuspendActionProps {
  userId: string;
  userName: string;
  isSuspended: boolean;
}

export function SuspendAction({
  userId,
  userName,
  isSuspended,
}: SuspendActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const action = isSuspended ? "unsuspend" : "suspend";
  const Icon = isSuspended ? ShieldCheck : ShieldAlert;
  const label = isSuspended ? "Unsuspend User" : "Suspend User";

  async function handleSubmit() {
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? `Failed to ${action} user`);
        return;
      }

      toast.success(`User ${action}ed successfully`);
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={isSuspended ? "default" : "destructive"}
          size="sm"
        >
          <Icon size={16} />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}</AlertDialogTitle>
          <AlertDialogDescription>
            {isSuspended
              ? `This will restore ${userName}'s access to the platform.`
              : `This will prevent ${userName} from creating new listings.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="suspend-reason">Reason (required)</Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isSuspended
                  ? "Why are you unsuspending this user?"
                  : "Why are you suspending this user?"
              }
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Processing..." : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
