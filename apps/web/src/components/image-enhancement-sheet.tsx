"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface EnhancedVariant {
  id: string;
  blobUrl: string;
}

interface ImageEnhancementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  imageId: string;
  originalUrl: string;
  variants: EnhancedVariant[];
  onVariantsChange: (variants: EnhancedVariant[]) => void;
}

export function ImageEnhancementSheet({
  open,
  onOpenChange,
  listingId,
  imageId,
  originalUrl,
  variants,
  onVariantsChange,
}: ImageEnhancementSheetProps) {
  const [enhancing, setEnhancing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  // Clean up polling interval on unmount
  useEffect(() => clearPolling, []);

  const handleEnhance = useCallback(async () => {
    setEnhancing(true);

    try {
      const response = await fetch(`/api/listings/${listingId}/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) {
        throw new Error("Enhancement request failed");
      }

      // Poll for the new enhanced variant
      const interval = setInterval(async () => {
        const listingRes = await fetch(`/api/listings/${listingId}`);
        if (!listingRes.ok) return;

        const listing = await listingRes.json();
        const images = listing.images as {
          id: string;
          blobUrl: string;
          type: string;
          parentImageId: string | null;
        }[];

        const newVariants = images
          .filter((img) => img.type === "ENHANCED" && img.parentImageId === imageId)
          .map((img) => ({ id: img.id, blobUrl: img.blobUrl }));

        if (newVariants.length > variants.length) {
          clearInterval(interval);
          pollingRef.current = null;
          setEnhancing(false);
          onVariantsChange(newVariants);
          toast.success("Enhanced photo ready");
        }
      }, 3000);

      pollingRef.current = interval;
    } catch {
      setEnhancing(false);
      toast.error("Enhancement failed — try again");
    }
  }, [listingId, imageId, variants.length, onVariantsChange]);

  const handleDelete = useCallback(
    (variantId: string) => {
      const deletedVariant = variants.find((v) => v.id === variantId);
      if (!deletedVariant) return;

      const updatedVariants = variants.filter((v) => v.id !== variantId);
      onVariantsChange(updatedVariants);

      let undone = false;

      toast.info("Image deleted", {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            undone = true;
            onVariantsChange(variants);
          },
        },
        onDismiss: async () => {
          if (undone) return;
          await fetch(`/api/listings/${listingId}/images`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId: variantId }),
          });
        },
      });
    },
    [variants, onVariantsChange, listingId],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        clearPolling();
        setEnhancing(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85svh]">
        <SheetHeader>
          <SheetTitle>Enhance Photo</SheetTitle>
          <SheetDescription>
            AI will clean up lighting and background
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {/* Original Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalUrl}
              alt="Original photo"
              className="h-full w-full object-cover"
            />
            <span className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
              Original
            </span>
          </div>

          {/* Enhanced Variants */}
          {variants.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Enhanced versions</p>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg ring-2 ring-transparent hover:ring-primary/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={variant.blobUrl}
                      alt="Enhanced variant"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7 bg-black/40 text-white hover:bg-black/60"
                      onClick={() => handleDelete(variant.id)}
                      aria-label="Delete enhanced variant"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhancement In Progress */}
          {enhancing && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="animate-spin text-primary" size={20} />
              <span className="text-sm text-muted-foreground">
                Enhancing...
              </span>
            </div>
          )}

          {/* Enhance Action */}
          {!enhancing && (
            <Button
              variant="outline"
              className="mt-4 h-11 w-full"
              onClick={handleEnhance}
            >
              <Sparkles size={16} />
              Generate Enhanced Version
            </Button>
          )}
        </div>

        <SheetFooter>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleOpenChange(false)}
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
