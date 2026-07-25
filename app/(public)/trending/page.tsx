import { getLocale, getTranslations } from "next-intl/server";

import { getShops } from "@/lib/queries";
import { getProducts } from "@/lib/products";
import { RETAILERS } from "@/lib/retailers";
import { TrendingFlame } from "@/components/TrendingFlame";
import { TrendCarousel, type TrendItem } from "@/components/TrendCarousel";
import {
  localizedName,
  localizedPrice,
} from "@/lib/i18n-food";
import type { Product, ShopWithFoods } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Trending-first, then highest-viewed; always returns up to `n` so a section is
 *  never empty even before anything is flagged 급상승. */
function pickTrend<T extends { is_trending: boolean; view_count: number }>(
  items: T[],
  n = 10,
): T[] {
  return [...items]
    .sort((a, b) => {
      if (a.is_trending !== b.is_trending) return a.is_trending ? -1 : 1;
      return b.view_count - a.view_count;
    })
    .slice(0, n);
}

export default async function TrendingPage() {
  const [t, locale, shops, oy, daiso] = await Promise.all([
    getTranslations("trending"),
    getLocale(),
    getShops(),
    getProducts("olive_young"),
    getProducts("daiso"),
  ]);

  const foodItems: TrendItem[] = pickTrend(shops).map((s: ShopWithFoods) => {
    const name = localizedName(s, locale);
    const dish = s.foods[0] ? localizedName(s.foods[0], locale) : null;
    return {
      id: s.id,
      href: `/shop/${s.id}`,
      image: s.thumbnail_url,
      title: name,
      subtitle: dish && !name.includes(dish) ? dish : null,
      priceLabel: localizedPrice(s.price_range, locale),
      views: s.view_count,
      trending: s.is_trending,
      fallbackEmoji: "🍢",
    };
  });

  const toProductItems = (list: Product[], emoji: string): TrendItem[] =>
    pickTrend(list).map((p) => ({
      id: p.id,
      href: `/product/${p.id}`,
      image: p.thumbnail_url,
      title: localizedName(p, locale),
      subtitle: p.brand,
      priceLabel: localizedPrice(p.price_range, locale),
      views: p.view_count,
      trending: p.is_trending,
      fallbackEmoji: emoji,
    }));

  const oyItems = toProductItems(oy, RETAILERS.olive_young.emoji);
  const daisoItems = toProductItems(daiso, RETAILERS.daiso.emoji);

  return (
    <div className="space-y-7 pb-8 pt-5">
      <header className="space-y-1.5 px-4">
        <h1 className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <TrendingFlame interactive={false} className="size-6" />
          {t("title")}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("subtitle")}</p>
      </header>

      <TrendCarousel
        emoji="🍢"
        title={t("sectionFood")}
        seeAllHref="/"
        seeAllLabel={t("seeAll")}
        items={foodItems}
      />
      <TrendCarousel
        emoji={RETAILERS.olive_young.emoji}
        title={locale === "ja" ? RETAILERS.olive_young.ja : RETAILERS.olive_young.ko}
        accent={RETAILERS.olive_young.accent}
        seeAllHref={RETAILERS.olive_young.href}
        seeAllLabel={t("seeAll")}
        items={oyItems}
      />
      <TrendCarousel
        emoji={RETAILERS.daiso.emoji}
        title={locale === "ja" ? RETAILERS.daiso.ja : RETAILERS.daiso.ko}
        accent={RETAILERS.daiso.accent}
        seeAllHref={RETAILERS.daiso.href}
        seeAllLabel={t("seeAll")}
        items={daisoItems}
      />
    </div>
  );
}
