import { getTranslations } from "next-intl/server";
import { Flame } from "lucide-react";

import type { Food } from "@/lib/types";
import { sortFoods } from "@/lib/sort";
import { FoodCard } from "@/components/FoodCard";

export async function TrendingSection({ foods }: { foods: Food[] }) {
  const t = await getTranslations("home");
  const trending = sortFoods(
    foods.filter((f) => f.is_trending),
    "popular",
  );
  if (trending.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="size-5 text-primary" />
        <h2 className="text-lg font-bold">{t("trendingTitle")}</h2>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {trending.map((food, i) => (
          <div key={food.id} className="w-40 shrink-0 snap-start sm:w-44">
            <FoodCard food={food} rank={i + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
