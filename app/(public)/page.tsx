import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";

import { getShops } from "@/lib/queries";
import { ShopExplorer } from "@/components/ShopExplorer";

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
          <ShopExplorer shops={shops} />
        )}
      </div>
    </div>
  );
}
