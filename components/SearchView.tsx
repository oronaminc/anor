"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

import type { Food } from "@/lib/types";
import { filterFoods, sortFoods } from "@/lib/sort";
import { FoodCard } from "@/components/FoodCard";

/** Debounce a changing value. */
function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SearchView({ foods }: { foods: Food[] }) {
  const t = useTranslations("search");
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useDebounced(raw, 180);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(
    () => sortFoods(filterFoods(foods, query), "popular"),
    [foods, query],
  );

  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-5 px-4 pt-3">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>

      <div className="sticky top-14 z-10 -mx-1 bg-background/80 px-1 py-1 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            type="search"
            enterKeyHint="search"
            className="h-12 w-full rounded-2xl border border-input bg-card pl-11 pr-10 text-base shadow-sm outline-none ring-ring focus-visible:ring-2"
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
            {results.map((food) => (
              <FoodCard key={food.id} food={food} query={query} />
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
