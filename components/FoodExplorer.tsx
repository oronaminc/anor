"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { TrendingUp, Clock } from "lucide-react";

import type { Food, SortKey } from "@/lib/types";
import { sortFoods } from "@/lib/sort";
import { cn } from "@/lib/utils";
import { FoodCard } from "@/components/FoodCard";

export function FoodExplorer({ foods }: { foods: Food[] }) {
  const t = useTranslations("home");
  const ts = useTranslations("sort");
  const [sort, setSort] = useState<SortKey>("popular");

  const visible = useMemo(() => sortFoods(foods, sort), [foods, sort]);

  return (
    <section id="explore" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{t("allMenu")}</h2>
        <span className="text-sm text-muted-foreground">
          {t("count", { count: visible.length })}
        </span>
      </div>

      <div
        role="tablist"
        aria-label={ts("label")}
        className="inline-flex rounded-full border bg-muted/40 p-1"
      >
        <SortButton
          active={sort === "popular"}
          onClick={() => setSort("popular")}
          icon={<TrendingUp className="size-4" />}
          label={ts("popular")}
        />
        <SortButton
          active={sort === "latest"}
          onClick={() => setSort("latest")}
          icon={<Clock className="size-4" />}
          label={ts("latest")}
        />
      </div>

      <motion.div
        layout
        className="grid grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.04 } },
        }}
      >
        {visible.map((food) => (
          <motion.div
            key={food.id}
            layout
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <FoodCard food={food} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function SortButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
