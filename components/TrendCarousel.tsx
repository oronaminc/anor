import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";

import { TrendingFlame } from "@/components/TrendingFlame";
import { formatViewCount, isUnoptimizedImage, photoAnim } from "@/lib/utils";

export type TrendItem = {
  id: string;
  href: string;
  image: string | null;
  title: string;
  subtitle?: string | null;
  priceLabel?: string | null;
  views: number;
  trending: boolean;
  /** emoji shown when there's no image */
  fallbackEmoji: string;
};

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/**
 * A horizontally-scrolling "trend" strip: one section (길거리 음식 / 올리브영 /
 * 다이소) rendered identically so the unified trending page reads as one system.
 * Pure server component — items arrive already localized.
 */
export function TrendCarousel({
  emoji,
  title,
  accent,
  seeAllHref,
  seeAllLabel,
  items,
}: {
  emoji: string;
  title: string;
  accent?: string;
  seeAllHref: string;
  seeAllLabel: string;
  items: TrendItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2 px-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight">
          <span
            className="h-5 w-1.5 rounded-full"
            style={{ backgroundColor: accent ?? "hsl(var(--primary))" }}
            aria-hidden
          />
          <span aria-hidden>{emoji}</span>
          {title}
        </h2>
        <Link
          href={seeAllHref}
          className="shrink-0 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          {seeAllLabel} ›
        </Link>
      </div>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {items.map((it, i) => (
          <Link
            key={it.id}
            prefetch={false}
            href={it.href}
            className="w-36 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:bg-muted/50 sm:w-40"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
              {it.image ? (
                <Image
                  src={it.image}
                  alt={it.title}
                  fill
                  sizes="160px"
                  unoptimized={isUnoptimizedImage(it.image)}
                  className={`object-cover ${photoAnim(it.id)}`}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">
                  {it.fallbackEmoji}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute left-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-black/55 text-xs font-extrabold tabular-nums text-white backdrop-blur">
                {RANK_MEDALS[i + 1] ?? i + 1}
              </span>
              {it.trending && (
                <span className="absolute right-2 top-2">
                  <TrendingFlame interactive={false} className="size-4" />
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="line-clamp-2 text-[13px] font-bold leading-tight text-white drop-shadow">
                  {it.title}
                </p>
              </div>
            </div>
            <div className="space-y-0.5 p-2.5">
              {it.subtitle && (
                <p className="truncate text-[11px] text-muted-foreground">{it.subtitle}</p>
              )}
              <div className="flex items-center justify-between gap-1">
                {it.priceLabel ? (
                  <span className="text-xs font-bold text-foreground">{it.priceLabel}</span>
                ) : (
                  <span />
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                  <Eye className="size-3" />
                  {formatViewCount(it.views)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
