import { getLocale, getTranslations } from "next-intl/server";

import { getProducts, getRetailStores } from "@/lib/products";
import { RETAILERS, type Retailer } from "@/lib/retailers";
import { RetailRankingView } from "@/components/RetailRankingView";

/** Server wrapper for a retailer's ranking page: fetch products + stores, render
 *  the localized header, then hand off to the client ranking view. */
export async function RetailRankingPage({ retailer }: { retailer: Retailer }) {
  const [products, stores, locale, t] = await Promise.all([
    getProducts(retailer),
    getRetailStores(retailer),
    getLocale(),
    getTranslations("retail"),
  ]);
  const meta = RETAILERS[retailer];

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      <header className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="flex items-center gap-2 text-[22px] font-extrabold leading-tight tracking-tight">
          <span aria-hidden>{meta.emoji}</span>
          {locale === "ja" ? meta.ja : meta.ko}
          <span className="text-muted-foreground">{t("rankingWord")}</span>
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {locale === "ja" ? meta.tagline_ja : meta.tagline_ko}
        </p>
      </header>

      <RetailRankingView retailer={retailer} products={products} stores={stores} />
    </div>
  );
}
