"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Eye, Heart, MapPin } from "lucide-react";

import type { ShopWithFoods } from "@/lib/types";
import { localizedName } from "@/lib/i18n-food";
import { HighlightText } from "@/components/HighlightText";
import { TrendingFlame } from "@/components/TrendingFlame";
import { LinePayBadge } from "@/components/LinePayBadge";

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
      prefetch={false}
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
          {shop.line_pay && <LinePayBadge className="ml-0.5" />}
        </div>

        {shop.district && (
          <p className="mt-0.5 inline-flex items-center gap-0.5 text-[12px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {shop.district}
          </p>
        )}

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
            <span
              data-testid="card-like"
              className="inline-flex items-center gap-1 tabular-nums"
            >
              <Heart className="size-3.5" />
              {shop.like_count.toLocaleString()}
            </span>
            <span
              data-testid="card-view"
              className="inline-flex items-center gap-1 tabular-nums"
            >
              <Eye className="size-3.5" />
              {shop.view_count.toLocaleString()}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
