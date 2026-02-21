import type { ReactNode } from "react";

interface BottomBarProps {
  children: ReactNode;
}

export function BottomBar({ children }: BottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 px-5 py-3 pb-safe backdrop-blur-lg">
      {children}
    </div>
  );
}
