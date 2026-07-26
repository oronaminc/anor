"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

import type { Product, RetailStore } from "@/lib/types";
import {
  RETAIL_CATEGORIES,
  retailerMeta,
  type Retailer,
} from "@/lib/retailers";
import { filterProducts } from "@/lib/product-search";
import { cn } from "@/lib/utils";
import { ProductListItem } from "@/components/ProductListItem";
import GoogleMap from "@/components/GoogleMap";

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
  const [q, setQ] = useState("");
  const meta = retailerMeta(retailer);
  const retailerLabel = meta ? (locale === "ja" ? meta.ja : meta.ko) : "";

  const cats = useMemo(() => {
    const present = new Set(products.map((p) => p.category).filter(Boolean));
    return RETAIL_CATEGORIES[retailer].filter((c) => present.has(c.code));
  }, [products, retailer]);

  // Category chip + free-text search (`filterProducts` matches both languages,
  // so a JP user typing Japanese hits the same rows a KR user does).
  const ranked = useMemo(() => {
    const list = cat ? products.filter((p) => p.category === cat) : products;
    return filterProducts(list, q).map((p, i) => ({ rank: i + 1, product: p }));
  }, [products, cat, q]);

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
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          inputMode="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder", { retailer: retailerLabel })}
          aria-label={t("searchPlaceholder", { retailer: retailerLabel })}
          className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-9 text-sm outline-none transition-colors focus:border-foreground/40 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="clear"
            className="absolute right-2.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

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
          {q.trim() ? t("searchEmpty") : t("empty")}
        </p>
      ) : (
        <ol className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card/70">
          {ranked.map(({ rank, product }) => (
            <ProductListItem
              key={product.id}
              product={product}
              rank={rank}
              query={q}
            />
          ))}
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
