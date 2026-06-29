"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The trending fire. A live, always-burning gradient flame (the one place color
 * is intentionally used in the otherwise-monochrome UI, because trending is
 * special). The outer flame and the inner core flicker out of phase and the
 * whole icon pulses a warm glow. When `interactive`, tapping plays a one-shot
 * flare-up and does NOT follow the surrounding card link. Honors
 * prefers-reduced-motion (the CSS stops all motion, leaving a static flame).
 */
export function TrendingFlame({
  className,
  interactive = true,
}: {
  className?: string;
  interactive?: boolean;
}) {
  const id = useId();
  const [taps, setTaps] = useState(0);

  function ignite(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    setTaps((n) => n + 1);
  }

  const svg = (
    <svg
      key={taps}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("flame-fire", taps > 0 && "flame-burst", className || "size-4")}
    >
      <defs>
        <linearGradient id={`${id}-o`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff1e00" />
          <stop offset="45%" stopColor="#ff7a00" />
          <stop offset="100%" stopColor="#ffd21e" />
        </linearGradient>
        <linearGradient id={`${id}-c`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff8a00" />
          <stop offset="55%" stopColor="#ffd21e" />
          <stop offset="100%" stopColor="#fff7cc" />
        </linearGradient>
      </defs>
      <path
        className="flame-outer"
        fill={`url(#${id}-o)`}
        d="M12 2C9.8 5 11 7.5 9 9.8 7.6 11.4 6 13 6 15.5 6 18.5 8.7 21 12 21s6-2.5 6-5.5c0-2-1-3.6-2.2-5-.2.9-1 1.5-1.8 1.4C15 9 13.8 5.4 12 2z"
      />
      <path
        className="flame-core"
        fill={`url(#${id}-c)`}
        d="M12 21c-1.9 0-3.3-1.5-3.3-3.4 0-1.6 1-2.8 1.9-4 .2.9.7 1.3 1.4 1.4-.2 1.3 1 2 1.7 2.7.6.7 1.6 1.4 1.6 2.6C15.3 19.5 13.9 21 12 21z"
      />
    </svg>
  );

  if (!interactive) return svg;

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="trending"
      onClick={ignite}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") ignite(e);
      }}
      className="inline-flex shrink-0 cursor-pointer items-center justify-center outline-none"
    >
      {svg}
    </span>
  );
}
