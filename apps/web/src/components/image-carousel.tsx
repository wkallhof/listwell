"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselImage {
  id: string;
  blobUrl: string;
  type: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  onEnhance?: (imageId: string) => void;
}

export function ImageCarousel({ images, onEnhance }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const index = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIndex(index);
    },
    [],
  );

  // Close lightbox on Escape key
  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxIndex]);

  if (images.length === 0) {
    return <div className="aspect-[4/3] rounded-lg bg-muted" />;
  }

  return (
    <div>
      <div
        className="flex snap-x snap-mandatory scroll-smooth overflow-x-auto scrollbar-hide"
        role="region"
        aria-label="Image carousel"
        onScroll={handleScroll}
      >
        {images.map((image, index) => (
          <div key={image.id} className="w-full flex-shrink-0 snap-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.blobUrl}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full cursor-zoom-in object-contain"
                onClick={() => setLightboxIndex(index)}
              />
              {image.type === "ORIGINAL" && onEnhance && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-3 right-3"
                  onClick={() => onEnhance(image.id)}
                  aria-label="Enhance this image"
                >
                  <Sparkles size={14} />
                  Enhance
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div
          className="mt-3 flex justify-center gap-1.5"
          role="tablist"
          aria-label="Image indicators"
        >
          {images.map((image, index) => (
            <span
              key={image.id}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Image ${index + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                index === activeIndex
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-label="Fullscreen image"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 z-10 text-white hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close fullscreen"
          >
            <X size={24} />
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightboxIndex].blobUrl}
            alt=""
            className="max-h-full max-w-full object-contain p-4"
          />
        </div>
      )}
    </div>
  );
}
