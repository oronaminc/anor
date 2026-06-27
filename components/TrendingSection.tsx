import { getTranslations } from "next-intl/server";
import { Flame } from "lucide-react";

import type { ShopWithFoods } from "@/lib/types";
import { sortShops } from "@/lib/sort";
import { ShopCard } from "@/components/ShopCard";

export async function TrendingSection({ shops }: { shops: ShopWithFoods[] }) {
  const t = await getTranslations("home");
  const trending = sortShops(
    shops.filter((s) => s.is_trending),
    "popular",
  );
  if (trending.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2.5 font-display text-base font-extrabold uppercase tracking-wide">
        <span className="h-5 w-1 rounded-full bg-primary glow-sm" />
        <Flame className="size-5 text-primary animate-pulse-glow" />
        {t("trendingTitle")}
      </h2>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {trending.map((shop, i) => (
          <div key={shop.id} className="w-40 shrink-0 snap-start sm:w-44">
            <ShopCard shop={shop} rank={i + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
