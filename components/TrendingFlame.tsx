"use client";

import { useState } from "react";
import { Flame } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The trending flame logo. Tapping it ignites a brief red "burning" flicker
 * (red is the one retained hue in the monochrome design) and does NOT follow
 * the surrounding card link. Remounting the icon via a key restarts the
 * one-shot CSS animation on every tap.
 */
export function TrendingFlame({ className }: { className?: string }) {
  const [taps, setTaps] = useState(0);

  function ignite(e: React.MouseEvent | React.KeyboardEvent) {
    // Lives inside the card's <Link> — play the flare, don't navigate.
    e.preventDefault();
    e.stopPropagation();
    setTaps((n) => n + 1);
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="trending"
      onClick={ignite}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") ignite(e);
      }}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center text-foreground/70 outline-none",
        className,
      )}
    >
      <Flame
        key={taps}
        className={cn("size-3.5", taps > 0 && "animate-flame")}
      />
    </span>
  );
}
