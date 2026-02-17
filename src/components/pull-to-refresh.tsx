"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return;
      const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
      if (scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    },
    [refreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff > 0) {
        // Apply resistance — diminishing returns as you pull further
        const distance = Math.min(diff * 0.5, MAX_PULL);
        setPullDistance(distance);
      }
    },
    [refreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      router.refresh();
      // Brief delay so the user sees the spinner and server re-renders
      await new Promise((resolve) => setTimeout(resolve, 600));
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, refreshing, router]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{
          height: pullDistance > 0 || refreshing ? `${pullDistance}px` : "0px",
          transitionDuration: pulling.current ? "0ms" : "200ms",
        }}
      >
        <Loader2
          size={20}
          className={refreshing ? "animate-spin text-muted-foreground" : "text-muted-foreground"}
          style={{
            opacity: progress,
            transform: `rotate(${progress * 360}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
