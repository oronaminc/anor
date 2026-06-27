"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Eye, Heart } from "lucide-react";

import type { Food } from "@/lib/types";
import { formatViewCount } from "@/lib/utils";
import { localizedName, secondaryName } from "@/lib/i18n-food";
import { HighlightText } from "@/components/HighlightText";
import { TrendingFlame } from "@/components/TrendingFlame";

/** Threads-style feed row: small thumbnail + text, hairline-separated. */
export function FoodPost({ food, query }: { food: Food; query?: string }) {
  const locale = useLocale();
  const name = localizedName(food, locale);
  const secondary = secondaryName(food, locale);

  return (
    <Link
      href={`/food/${food.id}`}
      className="group flex gap-3 py-4 transition-opacity active:opacity-60"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
        {food.thumbnail_url ? (
          <Image
            src={food.thumbnail_url}
            alt={name}
            fill
            sizes="56px"
            unoptimized={food.thumbnail_url.startsWith("/demo/")}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            🍢
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[15px] font-bold leading-tight">
            <HighlightText text={name} query={query} />
          </h3>
          {food.is_trending && <TrendingFlame />}
        </div>

        {secondary && (
          <p className="truncate text-[13px] text-muted-foreground">
            {secondary}
          </p>
        )}

        {food.hashtags && food.hashtags.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-2 text-[13px] text-muted-foreground">
            {food.hashtags.slice(0, 3).map((tag) => (
              <span key={tag} className="truncate">
                #<HighlightText text={tag} query={query} />
              </span>
            ))}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          {food.price_range && (
            <span className="font-semibold text-foreground/80">
              {food.price_range}
            </span>
          )}
          {food.category && <span className="truncate">{food.category}</span>}
          <span className="ml-auto inline-flex shrink-0 items-center gap-2.5">
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3.5" />
              {formatViewCount(food.like_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" />
              {formatViewCount(food.view_count)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
