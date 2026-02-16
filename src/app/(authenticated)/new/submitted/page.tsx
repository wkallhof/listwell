"use client";

import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubmittedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-5 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle size={32} className="text-primary" />
      </div>

      <h1 className="text-2xl font-bold">You&apos;re all set</h1>
      <p className="mt-2 max-w-xs text-muted-foreground">
        We&apos;re analyzing your photos and researching prices. This usually
        takes about a minute.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        You&apos;ll get a notification when it&apos;s ready.
      </p>

      <Button
        className="mt-8 h-11 px-8"
        onClick={() => router.push("/")}
      >
        Back to Listings
      </Button>
    </div>
  );
}
