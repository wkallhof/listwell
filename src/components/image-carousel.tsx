"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface ImageCarouselProps {
  images: {
    id: string;
    blobUrl: string;
    type: string;
  }[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-lg bg-muted" />
    );
  }

  return (
    <div>
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        role="region"
        aria-label="Image carousel"
      >
        {images.map((image) => (
          <div
            key={image.id}
            className="w-full flex-shrink-0 snap-center"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <img
                src={image.blobUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Image indicators">
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
