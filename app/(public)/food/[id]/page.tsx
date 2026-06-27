import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Eye, MapPin, Youtube, Navigation } from "lucide-react";

import { getFoodById } from "@/lib/queries";
import { formatViewCount } from "@/lib/utils";
import { googleDirectionsUrl } from "@/lib/maps";
import {
  localizedName,
  secondaryName,
  localizedDescription,
} from "@/lib/i18n-food";
import { Button } from "@/components/ui/button";
import { TrendingBadge } from "@/components/FoodCard";
import { ViewTracker } from "@/components/ViewTracker";
import { LikeButton } from "@/components/LikeButton";
import GoogleMap from "@/components/GoogleMap";

export const dynamic = "force-dynamic";

export default async function FoodDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const food = await getFoodById(params.id);
  if (!food) notFound();

  const locale = await getLocale();
  const t = await getTranslations("detail");
  const name = localizedName(food, locale);
  const secondary = secondaryName(food, locale);
  const description = localizedDescription(food, locale);
  const hasCoords =
    typeof food.lat === "number" && typeof food.lng === "number";

  return (
    <div className="pb-10">
      <ViewTracker foodId={food.id} />

      {/* Hero image */}
      <div className="relative aspect-[4/3] w-full bg-muted">
        {food.thumbnail_url ? (
          <Image
            src={food.thumbnail_url}
            alt={name}
            fill
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            unoptimized={food.thumbnail_url.startsWith("/demo/")}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            🍢
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
        <Link
          href="/"
          aria-label="Back"
          className="absolute left-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
        >
          <ArrowLeft className="size-5" />
        </Link>
        {food.is_trending && (
          <div className="absolute right-3 top-3">
            <TrendingBadge />
          </div>
        )}
      </div>

      <div className="space-y-6 px-4 pt-5">
        {/* Title block */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {food.category && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                {food.category}
              </span>
            )}
            {food.price_range && (
              <span className="text-sm font-bold text-primary">
                {food.price_range}
              </span>
            )}
          </div>
          <h1 className="font-display text-xl font-extrabold uppercase tracking-tight gradient-text">
            {name}
          </h1>
          {secondary && (
            <p className="font-display text-sm uppercase tracking-wider text-muted-foreground">
              {secondary}
            </p>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="size-4" />
            {t("views", { count: formatViewCount(food.view_count) })}
          </div>
          <div className="pt-1">
            <LikeButton foodId={food.id} initialCount={food.like_count} />
          </div>
        </div>

        {food.hashtags && food.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {food.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {description && (
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold uppercase tracking-wide">
              <span className="h-4 w-1 rounded-full bg-primary glow-sm" />
              {t("about")}
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-foreground/90">
              {description}
            </p>
          </div>
        )}

        {/* YouTube Shorts — external link, no embedded streaming */}
        {food.youtube_shorts_url && (
          <a
            href={food.youtube_shorts_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl bg-card/70 p-4 neon-border backdrop-blur transition-colors hover:bg-primary/5"
          >
            <span className="flex items-center gap-3 font-semibold">
              <Youtube className="size-6 text-red-500" />
              {t("youtube")}
            </span>
            <span className="text-sm text-muted-foreground">↗</span>
          </a>
        )}

        {/* Location + map */}
        {hasCoords && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold uppercase tracking-wide">
              <span className="h-5 w-1 rounded-full bg-primary glow-sm" />
              <MapPin className="size-5 text-primary" />
              {t("location")}
            </h2>
            {food.address && (
              <p className="text-sm text-muted-foreground">{food.address}</p>
            )}
            <GoogleMap
              foods={[food]}
              height="220px"
              className="overflow-hidden rounded-2xl neon-border"
            />
            <Button asChild className="w-full" size="lg">
              <a
                href={googleDirectionsUrl(food)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-5" />
                {t("directions")}
              </a>
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
