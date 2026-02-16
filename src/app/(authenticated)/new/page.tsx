"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomBar } from "@/components/bottom-bar";
import { ImageGrid } from "@/components/image-grid";
import { useNewListing } from "@/lib/new-listing-context";

export default function CapturePage() {
  const router = useRouter();
  const { photos, previewUrls, addPhotos, removePhoto } = useNewListing();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center px-5 pb-2 pt-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="ml-2 text-lg font-semibold">Add Photos</h1>
      </header>

      <div className="flex-1 px-5 py-4">
        <ImageGrid
          previewUrls={previewUrls}
          onAddPhotos={addPhotos}
          onRemovePhoto={removePhoto}
        />
      </div>

      <BottomBar>
        <Button
          className="h-11 w-full"
          disabled={photos.length === 0}
          onClick={() => router.push("/new/describe")}
        >
          {photos.length === 0
            ? "Next"
            : `Next — ${photos.length} photo${photos.length > 1 ? "s" : ""}`}
        </Button>
      </BottomBar>
    </div>
  );
}
