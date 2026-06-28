"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";

import { cn } from "@/lib/utils";

const storageKey = (id: string) => `anor:liked:${id}`;

/**
 * Anonymous "like" toggle. No login.
 *  - Tap → optimistic +1/-1 and a red heart with a pop, then reconcile to the
 *    server's stored like_count (stable — no organic growth, so no drift/cancel).
 *  - localStorage remembers this device's liked state; the real one-like-per-IP
 *    guarantee is the DB UNIQUE on shop_likes.
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
  const heart = useAnimationControls();

  useEffect(() => setCount(initialCount), [initialCount]);
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

    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    persist(nextLiked);
    if (nextLiked) {
      heart.start({
        scale: [1, 1.45, 0.9, 1.15, 1],
        transition: { duration: 0.45 },
      });
    }

    try {
      const res = await fetch(`/api/shops/${shopId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "failed");
      if (data && typeof data.like_count === "number") setCount(data.like_count);
      if (data && typeof data.liked === "boolean") {
        setLiked(data.liked);
        persist(data.liked);
      }
    } catch {
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
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60",
        liked
          ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
          : "border-border bg-card text-foreground hover:bg-muted",
        className,
      )}
    >
      <motion.span animate={heart} className="inline-flex">
        <Heart className={cn("size-4", liked && "fill-red-500 text-red-500")} />
      </motion.span>
      <span className="tabular-nums">{count.toLocaleString()}</span>
    </button>
  );
}
