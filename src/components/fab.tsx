"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FABProps {
  href?: string;
}

export function FAB({ href = "/new" }: FABProps) {
  const router = useRouter();

  return (
    <Button
      className="fixed bottom-6 right-5 z-50 h-14 w-14 rounded-full shadow-md"
      size="icon"
      onClick={() => router.push(href)}
      aria-label="Create new listing"
    >
      <Plus size={24} />
    </Button>
  );
}
