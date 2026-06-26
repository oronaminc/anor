"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { Food, SortKey } from "@/lib/types";
import { sortFoods } from "@/lib/sort";
import { cn } from "@/lib/utils";
import { FoodPost } from "@/components/FoodPost";

export function FoodExplorer({ foods }: { foods: Food[] }) {
  const t = useTranslations("home");
  const ts = useTranslations("sort");
  const [sort, setSort] = useState<SortKey>("popular");

  const visible = useMemo(() => sortFoods(foods, sort), [foods, sort]);

  return (
    <section id="explore" aria-label={t("allMenu")}>
      <h2 className="sr-only">{t("allMenu")}</h2>
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
        <div role="tablist" aria-label={ts("label")} className="flex gap-5">
          <SortTab
            active={sort === "popular"}
            onClick={() => setSort("popular")}
            label={ts("popular")}
          />
          <SortTab
            active={sort === "latest"}
            onClick={() => setSort("latest")}
            label={ts("latest")}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {t("count", { count: visible.length })}
        </span>
      </div>

      <div className="divide-y divide-border">
        {visible.map((food) => (
          <FoodPost key={food.id} food={food} />
        ))}
      </div>
    </section>
  );
}

function SortTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative py-2 text-sm font-semibold transition-colors",
        active
          ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
