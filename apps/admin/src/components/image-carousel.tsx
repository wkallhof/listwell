"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselImage {
  id: string;
  blobUrl: string;
  type: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  onEnhance?: (imageId: string) => void;
  onDelete?: (imageId: string) => void;
  enhancingImageId?: string | null;
  scrollToIndex?: number | null;
  onScrollComplete?: () => void;
}

export function ImageCarousel({
  images,
  onEnhance,
  onDelete,
  enhancingImageId,
  scrollToIndex,
  onScrollComplete,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const index = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIndex(index);
    },
    [],
  );

  // Auto-scroll when scrollToIndex changes
  useEffect(() => {
    if (scrollToIndex == null || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const targetLeft = scrollToIndex * container.clientWidth;
    container.scrollTo({ left: targetLeft, behavior: "smooth" });
    setActiveIndex(scrollToIndex);
    onScrollComplete?.();
  }, [scrollToIndex, onScrollComplete]);

  // Clamp lightbox index when images change
  useEffect(() => {
    if (lightboxIndex !== null && lightboxIndex >= images.length) {
      setLightboxIndex(images.length > 0 ? images.length - 1 : null);
    }
  }, [images.length, lightboxIndex]);

  // Lightbox keyboard and body scroll lock
  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : prev,
        );
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null && prev < images.length - 1 ? prev + 1 : prev,
        );
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [lightboxIndex, images.length]);

  function handleLightboxTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleLightboxTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) {
      if (delta > 0 && lightboxIndex !== null && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      } else if (
        delta < 0 &&
        lightboxIndex !== null &&
        lightboxIndex < images.length - 1
      ) {
        setLightboxIndex(lightboxIndex + 1);
      }
    }
    setTouchStartX(null);
  }

  if (images.length === 0) {
    return <div className="aspect-[4/3] rounded-lg bg-muted" />;
  }

  return (
    <div>
      <div
        ref={scrollContainerRef}
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

              {/* Scan-line enhancement overlay */}
              {enhancingImageId === image.id && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="animate-scan-line absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-black/60 px-4 py-1.5 text-sm font-medium text-white">
                      Enhancing...
                    </span>
                  </div>
                </div>
              )}

              {/* Enhance button */}
              {image.type === "ORIGINAL" &&
                onEnhance &&
                enhancingImageId !== image.id && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-3 right-3"
                    onClick={() => onEnhance(image.id)}
                    disabled={!!enhancingImageId}
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

      {/* Fullscreen lightbox with navigation */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-label="Fullscreen image viewer"
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top,0px),0.75rem)]">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close fullscreen"
            >
              <X size={24} />
            </Button>
            <span className="text-sm font-medium text-white">
              {lightboxIndex + 1} of {images.length}
            </span>
            {onDelete ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  onDelete(images[lightboxIndex].id);
                }}
                aria-label="Delete image"
              >
                <Trash2 size={20} />
              </Button>
            ) : (
              <div className="h-10 w-10" />
            )}
          </div>

          {/* Main image area */}
          <div className="relative flex flex-1 items-center justify-center">
            {/* Desktop arrow navigation */}
            {lightboxIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10 hidden text-white hover:bg-white/20 sm:flex"
                onClick={() => setLightboxIndex(lightboxIndex - 1)}
                aria-label="Previous image"
              >
                <ChevronLeft size={28} />
              </Button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIndex].blobUrl}
              alt=""
              className="max-h-full max-w-full object-contain p-4"
            />

            {lightboxIndex < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10 hidden text-white hover:bg-white/20 sm:flex"
                onClick={() => setLightboxIndex(lightboxIndex + 1)}
                aria-label="Next image"
              >
                <ChevronRight size={28} />
              </Button>
            )}
          </div>

          {/* Bottom dot indicators */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)]">
              {images.map((image, index) => (
                <span
                  key={image.id}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    index === lightboxIndex
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
