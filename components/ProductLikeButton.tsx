"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";

import { cn } from "@/lib/utils";

const storageKey = (id: string) => `anor:liked-product:${id}`;

/**
 * Anonymous "like" toggle for a product. Mirrors LikeButton: live count fetched
 * on mount (never the stale SSR number), optimistic toggle + heart pop, and a
 * localStorage device flag over the DB's one-like-per-IP guarantee.
 */
export function ProductLikeButton({
  productId,
  initialCount,
  className,
}: {
  productId: string;
  initialCount: number;
  className?: string;
}) {
  const t = useTranslations("detail");
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const heart = useAnimationControls();

  function persist(value: boolean) {
    try {
      localStorage.setItem(storageKey(productId), value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(storageKey(productId)) === "1");
    } catch {
      /* private mode — ignore */
    }
    fetch(`/api/products/${productId}/like`)
      .then((r) => r.json())
      .then((data) => {
        setCount(typeof data?.like_count === "number" ? data.like_count : initialCount);
        if (typeof data?.liked === "boolean") {
          setLiked(data.liked);
          persist(data.liked);
        }
      })
      .catch(() => setCount(initialCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function onToggle() {
    if (pending) return;
    setPending(true);

    const base = count ?? initialCount;
    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;

    setLiked(nextLiked);
    setCount(Math.max(0, base + (nextLiked ? 1 : -1)));
    persist(nextLiked);
    if (nextLiked) {
      heart.start({ scale: [1, 1.45, 0.9, 1.15, 1], transition: { duration: 0.45 } });
    }

    try {
      const res = await fetch(`/api/products/${productId}/like`, {
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
      data-testid="product-like-button"
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
      {count === null ? (
        <span
          className="inline-block h-[1em] w-8 animate-pulse rounded bg-foreground/20 align-[-0.15em]"
          aria-hidden
        />
      ) : (
        <span data-testid="product-like-count" className="tabular-nums">
          {count.toLocaleString()}
        </span>
      )}
    </button>
  );
}
