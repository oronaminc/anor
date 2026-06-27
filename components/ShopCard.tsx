"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Eye, Heart } from "lucide-react";

import type { ShopWithFoods } from "@/lib/types";
import { formatViewCount } from "@/lib/utils";
import { localizedName, secondaryName } from "@/lib/i18n-food";
import { HighlightText } from "@/components/HighlightText";

export function TrendingBadge({ rank }: { rank?: number }) {
  const t = useTranslations("badge");
  const hot = typeof rank === "number" ? rank <= 2 : true;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-holo px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground glow-sm">
      {hot ? `🔥 ${t("hot")}` : `⬆ ${t("rising")}`}
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
  const secondary = secondaryName(shop, locale);

  const menuNames = shop.foods.map((food) => localizedName(food, locale));
  const shownMenu = menuNames.slice(0, 3);
  const extraMenu = menuNames.length - shownMenu.length;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
    >
      <Link
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
              unoptimized={shop.thumbnail_url.startsWith("/demo/")}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
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
                {secondary}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 p-3">
          {menuNames.length > 0 && (
            <p className="truncate text-[11px] text-muted-foreground">
              {shownMenu.map((menuName, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  <HighlightText text={menuName} query={query} />
                </span>
              ))}
              {extraMenu > 0 && ` +${extraMenu}`}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            {shop.price_range ? (
              <span className="font-display text-xs font-bold tracking-wide text-primary">
                {shop.price_range}
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3.5" />
                {formatViewCount(shop.like_count)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" />
                {formatViewCount(shop.view_count)}
              </span>
            </span>
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
