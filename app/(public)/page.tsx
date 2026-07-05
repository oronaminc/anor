import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search, MapPin, ArrowRight } from "lucide-react";

import { getShops } from "@/lib/queries";
import { ShopExplorer } from "@/components/ShopExplorer";
import LazyGoogleMap from "@/components/LazyGoogleMap";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("home");
  const ts = await getTranslations("search");
  const shops = await getShops();

  return (
    <div className="pb-6">
      {/* Hero */}
      <section className="space-y-3 border-b border-border px-5 pb-6 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("heroEyebrow")}
        </p>
        <h1 className="whitespace-pre-line text-[20px] font-extrabold leading-[1.2] tracking-tight">
          {t("heroTitle")}
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {t("heroSubtitle")}
        </p>

        <Link
          href="/search"
          className="mt-1 flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors active:bg-muted"
        >
          <Search className="size-4" />
          {ts("placeholder")}
        </Link>
      </section>

      <div className="px-5 pt-4">
        {shops.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <>
            <ShopExplorer shops={shops} />

            {/* Map preview */}
            <section className="mt-8 space-y-3 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <MapPin className="size-4" />
                  {t("mapTitle")}
                </h2>
                <Link
                  href="/map"
                  className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("seeAll")}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <LazyGoogleMap
                shops={shops}
                height="200px"
                linkToDetail
                className="overflow-hidden rounded-2xl border border-border"
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
