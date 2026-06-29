"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import GoogleMap from "@/components/GoogleMap";
import { localizedName } from "@/lib/i18n-food";
import { cn } from "@/lib/utils";
import type { ShopFood, ShopWithFoods } from "@/lib/types";

/**
 * The /map experience: chips to filter the map by menu food, then the shops
 * serving it. Filtering is 100% client-side — the Google Map loads once and we
 * just hand it a different `shops` array, so changing the filter costs no extra
 * Maps API loads (no billing).
 */
export function MapExplorer({ shops }: { shops: ShopWithFoods[] }) {
  const locale = useLocale();
  const t = useTranslations("map");
  const [foodKo, setFoodKo] = useState<string | null>(null);

  // One chip per distinct menu food (keyed by Korean name).
  const foods = useMemo(() => {
    const seen = new Map<string, ShopFood>();
    for (const s of shops) {
      for (const f of s.foods) if (!seen.has(f.name_ko)) seen.set(f.name_ko, f);
    }
    return Array.from(seen.values());
  }, [shops]);

  const filtered = useMemo(
    () =>
      foodKo
        ? shops.filter((s) => s.foods.some((f) => f.name_ko === foodKo))
        : shops,
    [shops, foodKo],
  );

  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
        <Chip active={foodKo === null} onClick={() => setFoodKo(null)}>
          {t("all")}
        </Chip>
        {foods.map((f) => (
          <Chip
            key={f.name_ko}
            active={foodKo === f.name_ko}
            onClick={() => setFoodKo(f.name_ko)}
          >
            {localizedName(f, locale)}
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
