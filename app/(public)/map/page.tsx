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
        <div className="flex items-center gap-2">
          <MapPin className="size-6 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <GoogleMap
        foods={foods}
        height="calc(100dvh - 14rem)"
        linkToDetail
        className="overflow-hidden rounded-3xl border border-border/60"
      />
    </div>
  );
}
