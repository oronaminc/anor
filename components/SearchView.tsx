"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

import type { Product, ShopWithFoods } from "@/lib/types";
import { filterShops, sortShops } from "@/lib/sort";
import { filterProducts } from "@/lib/product-search";
import { normalizeQuery } from "@/lib/search";
import { RETAILER_CODES, retailerMeta, type Retailer } from "@/lib/retailers";
import { cn } from "@/lib/utils";
import { ShopCard } from "@/components/ShopCard";
import { ProductListItem } from "@/components/ProductListItem";

/** Which pillar the results are limited to. `all` searches every pillar. */
type Scope = "all" | "food" | Retailer;

const SCOPES: Scope[] = ["all", "food", ...RETAILER_CODES];

/** Debounce a changing value. */
function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Unified search across all three content pillars (street food shops, Olive
 * Young, Daiso). One query box + scope chips; `all` shows every non-empty
 * pillar as its own section, a specific scope shows just that one. All
 * filtering is client-side over data the server already sent.
 */
export function SearchView({
  shops,
  products,
}: {
  shops: ShopWithFoods[];
  products: Product[];
}) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [raw, setRaw] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useDebounced(raw, 180);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const scopeLabel = (s: Scope) => {
    if (s === "all") return t("scopeAll");
    if (s === "food") return t("scopeFood");
    const meta = retailerMeta(s);
    return meta ? (locale === "ja" ? meta.ja : meta.ko) : s;
  };

  // Every pillar is always filtered, so the chips can show how many results
  // each one holds — that's how you discover your query matched another pillar.
  const foodHits = useMemo(
    () => sortShops(filterShops(shops, query), "popular"),
    [shops, query],
  );
  const productHits = useMemo(
    () => filterProducts(products, query),
    [products, query],
  );
  const hitsByRetailer = useMemo(
    () =>
      Object.fromEntries(
        RETAILER_CODES.map((r) => [
          r,
          productHits.filter((p) => p.retailer === r),
        ]),
      ) as Record<Retailer, Product[]>,
    [productHits],
  );

  const countFor = (s: Scope) =>
    s === "all"
      ? foodHits.length + productHits.length
      : s === "food"
        ? foodHits.length
        : hitsByRetailer[s].length;

  const hasQuery = query.trim().length > 0;
  const total = countFor(scope);
  const showFood = (scope === "all" || scope === "food") && foodHits.length > 0;

  // Collect search terms for the admin analytics dashboard. Fire-and-forget,
  // logged ~600ms after the query settles, once per distinct term.
  const lastLogged = useRef("");
  useEffect(() => {
    const normalized = normalizeQuery(query);
    if (!normalized || lastLogged.current === normalized) return;
    const id = setTimeout(() => {
      lastLogged.current = normalized;
      fetch("/api/search/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, locale, results: total }),
        keepalive: true,
      }).catch(() => {
        /* best-effort */
      });
    }, 600);
    return () => clearTimeout(id);
  }, [query, locale, total]);

  return (
    <div className="space-y-4 px-4 pt-3">
      <h1 className="font-display text-xl font-extrabold uppercase tracking-tight gradient-text">
        {t("title")}
      </h1>

      <div className="sticky top-14 z-10 -mx-1 space-y-2.5 bg-background/70 px-1 py-1 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-primary" />
          <input
            ref={inputRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            type="search"
            enterKeyHint="search"
            className="h-12 w-full rounded-2xl bg-card/70 pl-11 pr-10 text-base neon-border backdrop-blur outline-none ring-ring focus-visible:ring-2 focus-visible:glow [&::-webkit-search-cancel-button]:hidden"
          />
          {raw && (
            <button
              type="button"
              onClick={() => {
                setRaw("");
                inputRef.current?.focus();
              }}
              aria-label="Clear"
              className="absolute right-2.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Scope chips — pick which pillar to search. */}
        <div
          role="group"
          aria-label={t("scopeLabel")}
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 no-scrollbar"
        >
          {SCOPES.map((s) => {
            const active = scope === s;
            const count = countFor(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {scopeLabel(s)}
                {hasQuery && (
                  <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!hasQuery ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="text-5xl">🔎</span>
          <p className="text-sm text-muted-foreground">{t("prompt")}</p>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <span className="text-5xl">🥲</span>
          <p className="font-semibold">{t("empty")}</p>
          <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {t("results", { count: total })}
          </p>

          {showFood && (
            <section className="space-y-3">
              {scope === "all" && (
                <SectionHeading
                  label={t("scopeFood")}
                  count={foodHits.length}
                />
              )}
              <motion.div layout className="grid grid-cols-2 gap-3">
                {foodHits.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} query={query} />
                ))}
              </motion.div>
            </section>
          )}

          {RETAILER_CODES.map((r) => {
            const hits = hitsByRetailer[r];
            if ((scope !== "all" && scope !== r) || hits.length === 0) {
              return null;
            }
            return (
              <section key={r} className="space-y-3">
                {scope === "all" && (
                  <SectionHeading label={scopeLabel(r)} count={hits.length} />
                )}
                <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card/70">
                  {hits.map((product) => (
                    <ProductListItem
                      key={product.id}
                      product={product}
                      query={query}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <h2 className="flex items-baseline gap-2 text-base font-extrabold tracking-tight">
      {label}
      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
        {count}
      </span>
    </h2>
  );
}
