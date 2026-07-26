"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Eye } from "lucide-react";

import type { Product } from "@/lib/types";
import { retailerMeta } from "@/lib/retailers";
import { localizedName, localizedPrice } from "@/lib/i18n-food";
import { cn, formatViewCount, isUnoptimizedImage, photoAnim } from "@/lib/utils";
import { HighlightText } from "@/components/HighlightText";
import { TrendingFlame } from "@/components/TrendingFlame";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/**
 * One product row — shared by the retailer ranking lists (`rank` given) and the
 * unified search results (`rank` omitted, `query` highlights the match). Renders
 * its own <li>, so callers just provide the <ol>/<ul> and the key.
 */
export function ProductListItem({
  product,
  rank,
  query,
}: {
  product: Product;
  rank?: number;
  query?: string;
}) {
  const locale = useLocale();
  const meta = retailerMeta(product.retailer);
  const name = localizedName(product, locale);

  return (
    <li>
      <Link
        prefetch={false}
        href={`/product/${product.id}`}
        className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/60"
      >
        {rank !== undefined && (
          <span
            className={cn(
              "w-7 shrink-0 text-center font-display text-lg font-extrabold tabular-nums",
              rank <= 3 ? "" : "text-muted-foreground",
            )}
          >
            {MEDALS[rank] ?? rank}
          </span>
        )}
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
          {product.thumbnail_url ? (
            <Image
              src={product.thumbnail_url}
              alt={name}
              fill
              sizes="64px"
              unoptimized={isUnoptimizedImage(product.thumbnail_url)}
              className={`object-cover ${photoAnim(product.id)}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              {meta?.emoji ?? "🛍️"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {product.brand && (
            <p className="truncate text-xs font-semibold text-muted-foreground">
              <HighlightText text={product.brand} query={query} />
            </p>
          )}
          <p className="line-clamp-2 text-sm font-semibold leading-tight">
            <HighlightText text={name} query={query} />
          </p>
          <div className="mt-1 flex items-center gap-2.5">
            {product.price_range && (
              <span className="text-sm font-bold text-foreground">
                {localizedPrice(product.price_range, locale)}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <Eye className="size-3.5" />
              {formatViewCount(product.view_count)}
            </span>
            {product.is_trending && (
              <TrendingFlame interactive={false} className="size-3.5" />
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
