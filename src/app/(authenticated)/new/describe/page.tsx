"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BottomBar } from "@/components/bottom-bar";
import { VoiceInput } from "@/components/voice-input";
import { useNewListing } from "@/lib/new-listing-context";
import { createListing } from "@/lib/listing-actions";
import { uploadImages } from "@/lib/upload-client";

export default function DescribePage() {
  const router = useRouter();
  const { photos, previewUrls, description, setDescription } =
    useNewListing();
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");

  // Redirect if no photos
  if (photos.length === 0 && typeof window !== "undefined") {
    router.replace("/new");
    return null;
  }

  async function handleSubmit(skipDescription?: boolean) {
    setSubmitting(true);

    try {
      // Step 1: Upload images directly to R2
      setStatusText("Uploading photos...");
      let uploadedImages;
      try {
        uploadedImages = await uploadImages(photos, (fraction) => {
          const pct = Math.round(fraction * 100);
          setStatusText(`Uploading photos... ${pct}%`);
        });
      } catch (uploadErr) {
        const msg =
          uploadErr instanceof Error ? uploadErr.message : "Upload failed";
        console.error("[describe] Image upload failed:", uploadErr);
        toast.error(msg);
        setSubmitting(false);
        setStatusText("");
        return;
      }

      // Step 2: Create listing with image metadata
      setStatusText("Creating listing...");
      const result = await createListing({
        description: skipDescription ? undefined : description.trim() || undefined,
        images: uploadedImages,
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to create listing");
        setSubmitting(false);
        setStatusText("");
        return;
      }

      toast.info("Generating your listing...");
      router.push(`/listings/${result.listingId}`);
      // No reset() needed — context unmounts when leaving /new route group
    } catch (err) {
      console.error("[describe] Listing creation failed:", err);
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(msg);
      setSubmitting(false);
      setStatusText("");
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center px-5 pb-2 pt-[max(env(safe-area-inset-top,0px)+0.25rem,1rem)]">
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
          <div className="absolute bottom-3 right-3">
            <VoiceInput
              onTranscript={(text) => {
                setDescription(
                  description ? `${description} ${text}` : text,
                );
              }}
              disabled={submitting}
            />
          </div>
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
                {statusText || "Uploading..."}
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
