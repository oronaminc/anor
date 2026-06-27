import { getTranslations } from "next-intl/server";
import { Flame } from "lucide-react";

import { getShops } from "@/lib/queries";
import { formatWeekRange } from "@/lib/growth";
import { TrendingSection } from "@/components/TrendingSection";
import { RankingSection } from "@/components/RankingSection";

export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  const t = await getTranslations("trending");
  const shops = await getShops();
  const weekRange = formatWeekRange(Date.now());

  return (
    <div className="space-y-7 px-4 pt-4">
      <header className="space-y-1.5">
        <h1 className="flex items-center gap-2.5 font-display text-xl font-extrabold uppercase tracking-tight gradient-text text-glow">
          <Flame className="size-6 text-primary animate-pulse-glow" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
          📅 {t("thisWeek")} · {weekRange}
        </p>
      </header>

      <TrendingSection shops={shops} />

      <RankingSection shops={shops} />
    </div>
  );
}
