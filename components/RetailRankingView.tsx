"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Eye } from "lucide-react";

import type { Product, RetailStore } from "@/lib/types";
import {
  RETAIL_CATEGORIES,
  retailerMeta,
  type Retailer,
} from "@/lib/retailers";
import { localizedName, localizedPrice } from "@/lib/i18n-food";
import { formatViewCount, isUnoptimizedImage, photoAnim } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingFlame } from "@/components/TrendingFlame";
import GoogleMap from "@/components/GoogleMap";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/**
 * The retailer ranking experience (올리브영 / 다이소): category filter chips over
 * a numbered, view-ranked product list, plus a "where to buy" map of the
 * retailer's Myeongdong stores. Filtering + re-ranking is 100% client-side.
 */
export function RetailRankingView({
  retailer,
  products,
  stores,
}: {
  retailer: Retailer;
  products: Product[];
  stores: RetailStore[];
}) {
  const locale = useLocale();
  const t = useTranslations("retail");
  const [cat, setCat] = useState<string | null>(null);
  const meta = retailerMeta(retailer);

  const cats = useMemo(() => {
    const present = new Set(products.map((p) => p.category).filter(Boolean));
    return RETAIL_CATEGORIES[retailer].filter((c) => present.has(c.code));
  }, [products, retailer]);

  const ranked = useMemo(() => {
    const list = cat ? products.filter((p) => p.category === cat) : products;
    return list.map((p, i) => ({ rank: i + 1, product: p }));
  }, [products, cat]);

  const mapPoints = useMemo(
    () =>
      stores.map((s) => ({
        id: s.id,
        name_ko: s.name_ko,
        name_ja: s.name_ja,
        name_en: null,
        name_es: null,
        lat: s.lat,
        lng: s.lng,
      })),
    [stores],
  );

  return (
    <div className="space-y-5">
      {/* Category filter chips */}
      {cats.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          <Chip active={cat === null} accent={meta?.accent} onClick={() => setCat(null)}>
            {t("all")}
          </Chip>
          {cats.map((c) => (
            <Chip
              key={c.code}
              active={cat === c.code}
              accent={meta?.accent}
              onClick={() => setCat(c.code)}
            >
              {c.emoji} {locale === "ja" ? c.ja : c.ko}
            </Chip>
          ))}
        </div>
      )}

      {/* Ranked product list */}
      {ranked.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ol className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card/70">
          {ranked.map(({ rank, product }) => {
            const name = localizedName(product, locale);
            return (
              <li key={product.id}>
                <Link
                  prefetch={false}
                  href={`/product/${product.id}`}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn(
                      "w-7 shrink-0 text-center font-display text-lg font-extrabold tabular-nums",
                      rank <= 3 ? "" : "text-muted-foreground",
                    )}
                  >
                    {MEDALS[rank] ?? rank}
                  </span>
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
                        {product.brand}
                      </p>
                    )}
                    <p className="line-clamp-2 text-sm font-semibold leading-tight">
                      {name}
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
          })}
        </ol>
      )}

      {/* Where to buy — the retailer's Myeongdong stores on a map */}
      {mapPoints.some((p) => typeof p.lat === "number") && (
        <section className="space-y-3 pt-1">
          <h2 className="font-display text-base font-extrabold uppercase tracking-wide">
            {t("storesTitle")}
          </h2>
          <GoogleMap
            shops={mapPoints}
            height="240px"
            linkToDetail={false}
            zoom={16}
            className="overflow-hidden rounded-3xl border border-border"
          />
          <ul className="space-y-1.5">
            {stores.map((s) => (
              <li key={s.id} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {locale === "ja" ? s.name_ja || s.name_ko : s.name_ko}
                </span>
                {s.address ? ` · ${s.address}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Chip({
  active,
  accent,
  onClick,
  children,
}: {
  active: boolean;
  accent?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={active && accent ? { backgroundColor: accent, borderColor: accent } : undefined}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "border-transparent text-white"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
