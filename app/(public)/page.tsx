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
    <div className="space-y-8 pb-6">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-accent px-5 pb-6 pt-8 text-primary-foreground">
        <div className="relative z-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
            {t("heroEyebrow")}
          </p>
          <h1 className="whitespace-pre-line text-[26px] font-extrabold leading-tight">
            {t("heroTitle")}
          </h1>
          <p className="max-w-xs text-sm leading-relaxed opacity-90">
            {t("heroSubtitle")}
          </p>

          <Link
            href="/search"
            className="mt-2 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-sm font-medium text-slate-500 shadow-lg transition-transform active:scale-[0.98]"
          >
            <Search className="size-5 text-slate-400" />
            {ts("placeholder")}
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-5 -top-6 text-[120px] opacity-20">
          🌶️
        </div>
      </section>

      <div className="space-y-8 px-4">
        {foods.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <>
            <TrendingSection foods={foods} />
            <RankingSection foods={foods} />

            {/* Map preview */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="size-5 text-primary" />
                  <h2 className="text-lg font-bold">{t("mapTitle")}</h2>
                </div>
                <Link
                  href="/map"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  {t("seeAll")}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <GoogleMap
                foods={foods}
                height="260px"
                linkToDetail
                className="overflow-hidden rounded-3xl border border-border/60"
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
