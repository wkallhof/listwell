"use client";

import { useRef } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGridProps {
  previewUrls: string[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
}

export function ImageGrid({
  previewUrls,
  onAddPhotos,
  onRemovePhoto,
}: ImageGridProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onAddPhotos(files);
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  const canAddMore = previewUrls.length < 5;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {previewUrls.map((url, index) => (
          <div
            key={url}
            className="animate-fade-in-scale relative aspect-square overflow-hidden rounded-lg"
          >
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              decoding="async"
              className="h-full w-full object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 bg-black/40 text-white hover:bg-black/60"
              onClick={() => onRemovePhoto(index)}
              aria-label={`Remove photo ${index + 1}`}
            >
              <X size={14} />
            </Button>
          </div>
        ))}
        {canAddMore && (
          <button
            type="button"
            className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50"
            onClick={() => galleryRef.current?.click()}
            aria-label="Add photo"
          >
            <ImagePlus size={24} className="text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          variant="outline"
          className="h-12 flex-1"
          onClick={() => cameraRef.current?.click()}
          disabled={!canAddMore}
        >
          <Camera size={20} />
          Take Photo
        </Button>
        <Button
          variant="outline"
          className="h-12 flex-1"
          onClick={() => galleryRef.current?.click()}
          disabled={!canAddMore}
        >
          <ImagePlus size={20} />
          Choose from Library
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Add 3-5 photos from different angles for best results
      </p>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFiles}
        aria-hidden="true"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
        aria-hidden="true"
      />
    </div>
  );
}
