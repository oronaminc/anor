"use client";

import { useState, useTransition } from "react";

import { setGrowthSpeed } from "@/app/(admin)/admin/actions";
import { cn } from "@/lib/utils";

/**
 * Global organic-growth speed selector (0–5). 0 = no auto-growth (real clicks
 * only); 5 = fast (trending shops still grow faster). Applies site-wide.
 */
export function SpeedControl({ initial }: { initial: number }) {
  const [speed, setSpeed] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        자동 성장 속도
      </span>
      <div className="inline-flex overflow-hidden rounded-lg border">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={pending}
            aria-pressed={n === speed}
            onClick={() => {
              setSpeed(n);
              start(() => setGrowthSpeed(n));
            }}
            className={cn(
              "px-2.5 py-1 text-sm font-semibold transition-colors disabled:opacity-60",
              n === speed
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
