"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Eye } from "lucide-react";

import type { Food } from "@/lib/types";
import { formatViewCount } from "@/lib/utils";
import { localizedName, secondaryName } from "@/lib/i18n-food";
import { HighlightText } from "@/components/HighlightText";

export function TrendingBadge({ rank }: { rank?: number }) {
  const t = useTranslations("badge");
  const hot = typeof rank === "number" ? rank <= 2 : true;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-sm">
      {hot ? `🔥 ${t("hot")}` : `⬆️ ${t("rising")}`}
    </span>
  );
}

export function FoodCard({
  food,
  rank,
  query,
}: {
  food: Food;
  rank?: number;
  query?: string;
}) {
  const locale = useLocale();
  const name = localizedName(food, locale);
  const secondary = secondaryName(food, locale);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/food/${food.id}`}
        className="group block overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
          {food.thumbnail_url ? (
            <Image
              src={food.thumbnail_url}
              alt={name}
              fill
              sizes="(max-width: 480px) 50vw, 240px"
              unoptimized={food.thumbnail_url.startsWith("/demo/")}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              🍢
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {food.is_trending && (
            <div className="absolute left-2.5 top-2.5">
              <TrendingBadge rank={rank} />
            </div>
          )}
          {food.category && (
            <div className="absolute right-2.5 top-2.5 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-slate-800 backdrop-blur">
              {food.category}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 p-3 text-white">
            <h3 className="truncate text-[15px] font-extrabold leading-tight drop-shadow-sm">
              <HighlightText text={name} query={query} />
            </h3>
            {secondary && (
              <p className="truncate text-[11px] text-white/80">{secondary}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 p-3">
          <div className="flex items-center justify-between gap-2">
            {food.price_range ? (
              <span className="text-xs font-bold text-primary">
                {food.price_range}
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Eye className="size-3.5" />
              {formatViewCount(food.view_count)}
            </span>
          </div>

          {food.hashtags && food.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {food.hashtags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
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
