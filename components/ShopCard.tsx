"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Eye, Heart } from "lucide-react";

import type { ShopWithFoods } from "@/lib/types";
import { localizedName } from "@/lib/i18n-food";
import { HighlightText } from "@/components/HighlightText";
import { TrendingFlame } from "@/components/TrendingFlame";

// One admin flag (is_trending, "급상승") → ONE badge everywhere. The flame is the
// app's trending motif; the `rank` prop is accepted for call-site compatibility
// but no longer changes the badge (it used to split into HOT vs 급상승).
export function TrendingBadge(_props: { rank?: number } = {}) {
  const t = useTranslations("badge");
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-[0_0_12px_rgba(255,90,0,0.45)]"
      style={{ background: "linear-gradient(135deg, #ff2d00 0%, #ff8a00 100%)" }}
    >
      <TrendingFlame interactive={false} className="size-3.5" />
      {t("hot")}
    </span>
  );
}

export function ShopCard({
  shop,
  rank,
  query,
}: {
  shop: ShopWithFoods;
  rank?: number;
  query?: string;
}) {
  const locale = useLocale();
  const name = localizedName(shop, locale);
  // Subtitle = the dish this stall sells, localized (Korean in ko, Japanese in
  // ja) — so a creative name like "따봉 핫도그" shows its actual food underneath.
  const dish = shop.foods[0] ? localizedName(shop.foods[0], locale) : null;
  // Show it only when the (creative) shop name doesn't already contain the dish.
  const secondary = dish && !name.includes(dish) ? dish : null;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
    >
      <Link
        prefetch={false}
        href={`/shop/${shop.id}`}
        className="group relative block overflow-hidden rounded-3xl bg-card neon-border shadow-lg transition-shadow hover:glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
          {shop.thumbnail_url ? (
            <Image
              src={shop.thumbnail_url}
              alt={name}
              fill
              sizes="(max-width: 480px) 50vw, 240px"
              unoptimized={(shop.thumbnail_url.startsWith("/demo/") || shop.thumbnail_url.toLowerCase().endsWith(".svg"))}
              className="object-cover animate-photo"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              🍢
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

          {shop.is_trending && (
            <div className="absolute left-2.5 top-2.5">
              <TrendingBadge rank={rank} />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 p-3 text-white">
            <h3 className="truncate text-[15px] font-extrabold leading-tight drop-shadow-md transition-[text-shadow] group-hover:text-glow">
              <HighlightText text={name} query={query} />
            </h3>
            {secondary && (
              <p className="truncate font-display text-[10px] uppercase tracking-wider text-white/70">
                <HighlightText text={secondary} query={query} />
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 p-3">
          <div className="space-y-1.5">
            {shop.price_range && (
              <span className="block font-display text-xs font-bold tracking-wide text-primary">
                {shop.price_range}
              </span>
            )}
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Heart className="size-3.5 shrink-0" />
                {shop.like_count.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Eye className="size-3.5 shrink-0" />
                {shop.view_count.toLocaleString()}
              </span>
            </div>
          </div>

          {shop.hashtags && shop.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {shop.hashtags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                >
                  #<HighlightText text={tag} query={query} />
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
