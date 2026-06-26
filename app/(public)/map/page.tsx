import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";

import { getFoods } from "@/lib/queries";
import GoogleMap from "@/components/GoogleMap";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const t = await getTranslations("map");
  const foods = await getFoods();

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2.5 font-display text-xl font-extrabold uppercase tracking-tight gradient-text text-glow">
          <MapPin className="size-6 text-primary" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <GoogleMap
        foods={foods}
        height="calc(100dvh - 14rem)"
        linkToDetail
        className="overflow-hidden rounded-3xl neon-border"
      />
    </div>
  );
}
