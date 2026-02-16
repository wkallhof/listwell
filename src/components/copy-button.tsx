"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(
      label ? `${label.charAt(0).toUpperCase() + label.slice(1)} copied` : "Copied!",
    );
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground"
      onClick={handleCopy}
      aria-label={`Copy ${label ?? "text"}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </Button>
  );
}
