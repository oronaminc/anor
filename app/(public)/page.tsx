import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search, MapPin, ArrowRight } from "lucide-react";

import { getFoods } from "@/lib/queries";
import { TrendingSection } from "@/components/TrendingSection";
import { RankingSection } from "@/components/RankingSection";
import { FoodExplorer } from "@/components/FoodExplorer";
import GoogleMap from "@/components/GoogleMap";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("home");
  const ts = await getTranslations("search");
  const foods = await getFoods();

  return (
    <div className="space-y-9 pb-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2rem] border-b border-border px-5 pb-7 pt-9">
        <div className="relative z-10 space-y-3">
          <p className="inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse-glow" />
            {t("heroEyebrow")}
          </p>
          <h1 className="font-display whitespace-pre-line text-[20px] font-extrabold uppercase leading-[1.15] tracking-tight gradient-text animate-holo text-glow">
            {t("heroTitle")}
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t("heroSubtitle")}
          </p>

          <Link
            href="/search"
            className="mt-3 flex items-center gap-2.5 rounded-2xl bg-card/70 px-4 py-3 text-sm font-medium text-muted-foreground neon-border backdrop-blur transition-transform active:scale-[0.98]"
          >
            <Search className="size-5 text-primary" />
            {ts("placeholder")}
          </Link>
        </div>
      </section>

      <div className="space-y-9 px-4">
        {foods.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <>
            <TrendingSection foods={foods} />
            <RankingSection foods={foods} />

            {/* Map preview */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 font-display text-base font-extrabold uppercase tracking-wide">
                  <span className="h-5 w-1 rounded-full bg-primary glow-sm" />
                  <MapPin className="size-5 text-primary" />
                  {t("mapTitle")}
                </h2>
                <Link
                  href="/map"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  {t("seeAll")}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <GoogleMap
                foods={foods}
                height="260px"
                linkToDetail
                className="overflow-hidden rounded-3xl neon-border"
              />
              <p className="text-xs text-muted-foreground">{t("mapHint")}</p>
            </section>

            <FoodExplorer foods={foods} />
          </>
        )}
      </div>
    </div>
  );
}
