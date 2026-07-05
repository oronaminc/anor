"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import GoogleMap from "@/components/GoogleMap";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { ShopWithFoods } from "@/lib/types";

/**
 * The /map experience: chips to filter the map by broad food CATEGORY (a small,
 * fixed set — see lib/categories.ts), then the shops in it. Filtering is 100%
 * client-side — the Google Map loads once and we just hand it a different
 * `shops` array, so changing the filter costs no extra Maps API loads.
 */
export function MapExplorer({ shops }: { shops: ShopWithFoods[] }) {
  const locale = useLocale();
  const t = useTranslations("map");
  const [cat, setCat] = useState<string | null>(null);

  // Only the categories actually present among these shops, in canonical order.
  const cats = useMemo(() => {
    const present = new Set(shops.flatMap((s) => s.categories ?? []));
    return CATEGORIES.filter((c) => present.has(c.code));
  }, [shops]);

  const filtered = useMemo(
    () => (cat ? shops.filter((s) => (s.categories ?? []).includes(cat)) : shops),
    [shops, cat],
  );

  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <Chip active={cat === null} onClick={() => setCat(null)}>
          {t("all")}
        </Chip>
        {cats.map((c) => (
          <Chip
            key={c.code}
            active={cat === c.code}
            onClick={() => setCat(c.code)}
          >
            {c.emoji} {categoryLabel(c.code, locale)}
          </Chip>
        ))}
      </div>

      <GoogleMap
        shops={filtered}
        height="calc(100dvh - 17rem)"
        linkToDetail
        className="overflow-hidden rounded-3xl neon-border"
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
