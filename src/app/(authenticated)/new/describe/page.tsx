"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BottomBar } from "@/components/bottom-bar";
import { useNewListing } from "@/lib/new-listing-context";
import { createListing } from "@/lib/listing-actions";

export default function DescribePage() {
  const router = useRouter();
  const { photos, previewUrls, description, setDescription, reset } =
    useNewListing();
  const [submitting, setSubmitting] = useState(false);

  // Redirect if no photos
  if (photos.length === 0 && typeof window !== "undefined") {
    router.replace("/new");
    return null;
  }

  async function handleSubmit(skipDescription?: boolean) {
    setSubmitting(true);

    try {
      const formData = new FormData();
      if (!skipDescription && description.trim()) {
        formData.append("description", description.trim());
      }
      for (const photo of photos) {
        formData.append("images", photo);
      }

      const result = await createListing(formData);

      if (!result.success) {
        toast.error(result.error ?? "Failed to create listing");
        return;
      }

      toast.info("Generating your listing...");
      reset();
      router.push("/new/submitted");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center px-5 pb-2 pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/new")}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="ml-2 text-lg font-semibold">Describe It</h1>
      </header>

      <div className="flex-1 px-5 py-4">
        {/* Photo Thumbnail Strip */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {previewUrls.map((url, index) => (
            <div
              key={url}
              className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg"
            >
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Description Input */}
        <div className="relative mt-4">
          <Textarea
            placeholder="Tell us about this item — brand, condition, why you're selling... (optional)"
            className="min-h-[160px] resize-none pr-12 text-base"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          More detail = better results. But you can also skip this.
        </p>
      </div>

      <BottomBar>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="h-11 flex-1"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
          >
            Skip
          </Button>
          <Button
            className="h-11 flex-1"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Uploading...
              </>
            ) : (
              "Generate Listing"
            )}
          </Button>
        </div>
      </BottomBar>
    </div>
  );
}
