"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Eye, Heart } from "lucide-react";

import type { ShopWithFoods } from "@/lib/types";
import { formatViewCount } from "@/lib/utils";
import { localizedName } from "@/lib/i18n-food";
import { HighlightText } from "@/components/HighlightText";
import { TrendingFlame } from "@/components/TrendingFlame";

/** Threads-style feed row: small thumbnail + text, hairline-separated. */
export function ShopPost({
  shop,
  query,
}: {
  shop: ShopWithFoods;
  query?: string;
}) {
  const locale = useLocale();
  const name = localizedName(shop, locale);

  const menuNames = shop.foods.slice(0, 4).map((f) => localizedName(f, locale));
  const menuLine = menuNames.join(" · ");
  const extraCount = shop.foods.length - menuNames.length;

  return (
    <Link
      href={`/shop/${shop.id}`}
      className="group flex gap-3 py-4 transition-opacity active:opacity-60"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
        {shop.thumbnail_url ? (
          <Image
            src={shop.thumbnail_url}
            alt={name}
            fill
            sizes="56px"
            unoptimized={shop.thumbnail_url.startsWith("/demo/")}
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
          {shop.is_trending && <TrendingFlame />}
        </div>

        {menuLine && (
          <p className="truncate text-[13px] text-muted-foreground">
            {menuLine}
            {extraCount > 0 && ` +${extraCount}`}
          </p>
        )}

        {shop.hashtags && shop.hashtags.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-2 text-[13px] text-muted-foreground">
            {shop.hashtags.slice(0, 3).map((tag) => (
              <span key={tag} className="truncate">
                #<HighlightText text={tag} query={query} />
              </span>
            ))}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          {shop.price_range && (
            <span className="font-semibold text-foreground/80">
              {shop.price_range}
            </span>
          )}
          <span className="ml-auto inline-flex shrink-0 items-center gap-2.5">
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
      </div>
    </Link>
  );
}
