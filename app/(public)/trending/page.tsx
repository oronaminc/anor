import { getTranslations } from "next-intl/server";
import { Flame } from "lucide-react";

import { getShops } from "@/lib/queries";
import { TrendingSection } from "@/components/TrendingSection";
import { RankingSection } from "@/components/RankingSection";

export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  const t = await getTranslations("trending");
  const shops = await getShops();

  return (
    <div className="space-y-7 px-4 pt-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2.5 font-display text-xl font-extrabold uppercase tracking-tight gradient-text text-glow">
          <Flame className="size-6 text-primary animate-pulse-glow" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <TrendingSection shops={shops} />

      <RankingSection shops={shops} />
    </div>
  );
}
