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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MinusCircle } from "lucide-react";

interface CreditActionModalProps {
  userId: string;
  userName: string;
  currentBalance: number;
  action: "grant" | "deduct";
}

export function CreditActionModal({
  userId,
  userName,
  currentBalance,
  action,
}: CreditActionModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isGrant = action === "grant";
  const Icon = isGrant ? PlusCircle : MinusCircle;
  const label = isGrant ? "Grant Credits" : "Deduct Credits";

  async function handleSubmit() {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount: numAmount, reason: reason.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to update credits");
        return;
      }

      const data = await res.json();
      toast.success(`Credits updated. New balance: ${data.balance}`);
      setOpen(false);
      setAmount("");
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
          variant={isGrant ? "default" : "outline"}
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
            {isGrant ? "Add" : "Remove"} credits for {userName}. Current balance: {currentBalance}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="credit-amount">Amount</Label>
            <Input
              id="credit-amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Number of credits"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credit-reason">Reason (required)</Label>
            <Textarea
              id="credit-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you granting/deducting credits?"
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={loading || !amount || !reason.trim()}
          >
            {loading ? "Processing..." : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
