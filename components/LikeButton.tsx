"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";

import { cn } from "@/lib/utils";

const storageKey = (id: string) => `anor:liked:${id}`;

/**
 * Anonymous "like" toggle. No login. The reaction is the heart: tapping fills
 * it red with a pop, so a human press is unmistakable even though the big
 * weekly count barely moves by one. Optimistic, reconciles with the server,
 * localStorage remembers this device's liked state; the real one-like-per-IP
 * guarantee lives in the DB (UNIQUE on shop_likes).
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
  const router = useRouter();
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
      // Keep the clean optimistic ±1 — do NOT reconcile to the server's
      // organic-inflated weekly count (that made the number drift, e.g.
      // 3208 → 3210 → 3209). Only sync the liked state.
      if (data && typeof data.liked === "boolean") {
        setLiked(data.liked);
        persist(data.liked);
      }
      router.refresh(); // reflect the new count elsewhere (e.g. home feed)
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
