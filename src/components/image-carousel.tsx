"use client";

import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
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

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const index = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIndex(index);
    },
    [],
  );

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
              <img
                src={image.blobUrl}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover"
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
    </div>
  );
}
