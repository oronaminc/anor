"use client";

import { useTransition } from "react";
import { Flame } from "lucide-react";

import { toggleTrending } from "@/app/(admin)/admin/actions";
import { cn } from "@/lib/utils";

export function TrendingToggle({
  id,
  isTrending,
}: {
  id: string;
  isTrending: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          void toggleTrending(id, !isTrending);
        })
      }
      aria-pressed={isTrending}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
        isTrending
          ? "border-transparent bg-accent text-accent-foreground"
          : "bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      <Flame className="size-3.5" />
      {isTrending ? "급상승 ON" : "급상승 OFF"}
    </button>
  );
}
