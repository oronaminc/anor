"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";

import { cn, formatViewCount } from "@/lib/utils";

const storageKey = (id: string) => `anor:liked:${id}`;

/**
 * Anonymous "like" toggle. No login required.
 *
 *  - Optimistic UI: flips instantly, reconciles with the server's authoritative
 *    count when it responds (demo mode keeps the optimistic value).
 *  - localStorage remembers this device's liked state so a reload shows the
 *    heart filled and the button doesn't invite re-spamming (UX-layer dedupe).
 *  - The real "one like per IP" guarantee lives in the DB (UNIQUE on
 *    shop_likes); this component only POSTs the toggle.
 */
export function LikeButton({
  shopId,
  initialCount,
  className,
}: {
  shopId: string;
  initialCount: number;
  className?: string;
}) {
  const t = useTranslations("detail");
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(storageKey(shopId)) === "1");
    } catch {
      /* private mode — ignore */
    }
  }, [shopId]);

  function persist(value: boolean) {
    try {
      localStorage.setItem(storageKey(shopId), value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  async function onToggle() {
    if (pending) return;
    setPending(true);

    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;

    // Optimistic update.
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    persist(nextLiked);

    try {
      const res = await fetch(`/api/shops/${shopId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "failed");

      // Reconcile with the server's authoritative values when present.
      if (data && typeof data.like_count === "number") setCount(data.like_count);
      if (data && typeof data.liked === "boolean") {
        setLiked(data.liked);
        persist(data.liked);
      }
    } catch {
      // Revert to the captured pre-toggle state (restoring the exact count
      // avoids the Math.max-clamp asymmetry that could drift +1 at count 0).
      setLiked(prevLiked);
      setCount(prevCount);
      persist(prevLiked);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      data-testid="like-button"
      onClick={onToggle}
      disabled={pending}
      aria-pressed={liked}
      aria-label={t("like")}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60",
        liked
          ? "bg-foreground text-background"
          : "bg-card text-foreground hover:bg-muted",
        className,
      )}
    >
      <Heart className={cn("size-4", liked && "fill-current")} />
      <span className="tabular-nums">{formatViewCount(count)}</span>
    </button>
  );
}
