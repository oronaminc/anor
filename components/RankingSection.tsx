import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Eye } from "lucide-react";

import type { ShopWithFoods } from "@/lib/types";
import { rankByViews } from "@/lib/sort";
import { formatViewCount } from "@/lib/utils";
import { localizedName } from "@/lib/i18n-food";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export async function RankingSection({ shops }: { shops: ShopWithFoods[] }) {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const ranking = rankByViews(shops, 5);
  if (ranking.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2.5">
        <h2 className="flex items-center gap-2.5 font-display text-base font-extrabold uppercase tracking-wide">
          <span className="h-5 w-1 rounded-full bg-primary glow-sm" />
          {t("rankingTitle")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("rankingSubtitle")}
        </span>
      </div>

      <ol className="divide-y divide-white/5 overflow-hidden rounded-3xl bg-card/70 neon-border backdrop-blur">
        {ranking.map(({ rank, shop }) => (
          <li key={shop.id}>
            <Link
              prefetch={false}
              href={`/shop/${shop.id}`}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-primary/5"
            >
              <span className="w-6 shrink-0 text-center font-display text-lg font-extrabold tabular-nums text-primary">
                {MEDALS[rank] ?? rank}
              </span>
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                {shop.thumbnail_url ? (
                  <Image
                    src={shop.thumbnail_url}
                    alt={localizedName(shop, locale)}
                    fill
                    sizes="48px"
                    unoptimized={shop.thumbnail_url.startsWith("/demo/")}
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
                  {localizedName(shop, locale)}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground">
                <Eye className="size-4" />
                {formatViewCount(shop.view_count)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
