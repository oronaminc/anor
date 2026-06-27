"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

import type { ShopWithFoods } from "@/lib/types";
import { filterShops, sortShops } from "@/lib/sort";
import { normalizeQuery } from "@/lib/search";
import { ShopCard } from "@/components/ShopCard";

/** Debounce a changing value. */
function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SearchView({ shops }: { shops: ShopWithFoods[] }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useDebounced(raw, 180);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(
    () => sortShops(filterShops(shops, query), "popular"),
    [shops, query],
  );

  const hasQuery = query.trim().length > 0;

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
        body: JSON.stringify({ q: query, locale, results: results.length }),
        keepalive: true,
      }).catch(() => {
        /* best-effort */
      });
    }, 600);
    return () => clearTimeout(id);
  }, [query, locale, results.length]);

  return (
    <div className="space-y-5 px-4 pt-3">
      <h1 className="font-display text-xl font-extrabold uppercase tracking-tight gradient-text">
        {t("title")}
      </h1>

      <div className="sticky top-14 z-10 -mx-1 bg-background/70 px-1 py-1 backdrop-blur">
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
            className="h-12 w-full rounded-2xl bg-card/70 pl-11 pr-10 text-base neon-border backdrop-blur outline-none ring-ring focus-visible:ring-2 focus-visible:glow"
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
      </div>

      {!hasQuery ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="text-5xl">🔎</span>
          <p className="text-sm text-muted-foreground">{t("prompt")}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <span className="text-5xl">🥲</span>
          <p className="font-semibold">{t("empty")}</p>
          <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t("results", { count: results.length })}
          </p>
          <motion.div layout className="grid grid-cols-2 gap-3">
            {results.map((shop) => (
              <ShopCard key={shop.id} shop={shop} query={query} />
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
