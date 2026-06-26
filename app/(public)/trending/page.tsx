import { getTranslations } from "next-intl/server";
import { Flame } from "lucide-react";

import { getFoods } from "@/lib/queries";
import { sortFoods } from "@/lib/sort";
import { RankingSection } from "@/components/RankingSection";
import { FoodCard } from "@/components/FoodCard";

export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  const t = await getTranslations("trending");
  const th = await getTranslations("home");
  const foods = await getFoods();
  const trending = sortFoods(
    foods.filter((f) => f.is_trending),
    "popular",
  );

  return (
    <div className="space-y-7 px-4 pt-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2.5 font-display text-xl font-extrabold uppercase tracking-tight gradient-text text-glow">
          <Flame className="size-6 text-primary animate-pulse-glow" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {trending.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2.5 font-display text-base font-extrabold uppercase tracking-wide">
            <span className="h-5 w-1 rounded-full bg-primary glow-sm" />
            {th("trendingTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {trending.map((food, i) => (
              <FoodCard key={food.id} food={food} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      <RankingSection foods={foods} limit={10} />
    </div>
  );
}
