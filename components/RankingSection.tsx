import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Eye } from "lucide-react";

import type { Food } from "@/lib/types";
import { rankByViews } from "@/lib/sort";
import { formatViewCount } from "@/lib/utils";
import { localizedName } from "@/lib/i18n-food";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export async function RankingSection({
  foods,
  limit = 5,
}: {
  foods: Food[];
  limit?: number;
}) {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const ranking = rankByViews(foods, limit);
  if (ranking.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2.5">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold uppercase tracking-wide">
          <span className="h-5 w-1 rounded-full bg-primary glow-sm" />
          {t("rankingTitle")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("rankingSubtitle")}
        </span>
      </div>

      <ol className="divide-y divide-white/5 overflow-hidden rounded-3xl bg-card/70 neon-border backdrop-blur">
        {ranking.map(({ rank, food }) => (
          <li key={food.id}>
            <Link
              href={`/food/${food.id}`}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-primary/5"
            >
              <span className="w-6 shrink-0 text-center font-display text-lg font-extrabold tabular-nums text-primary">
                {MEDALS[rank] ?? rank}
              </span>
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                {food.thumbnail_url ? (
                  <Image
                    src={food.thumbnail_url}
                    alt={localizedName(food, locale)}
                    fill
                    sizes="48px"
                    unoptimized={food.thumbnail_url.startsWith("/demo/")}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    🍢
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {localizedName(food, locale)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {food.category}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground">
                <Eye className="size-4" />
                {formatViewCount(food.view_count)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
