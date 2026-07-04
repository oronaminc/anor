import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Eye, MapPin, Youtube, Navigation } from "lucide-react";

import { getShopById } from "@/lib/queries";
import { googleDirectionsUrl } from "@/lib/maps";
import {
  localizedName,
  secondaryName,
  localizedDescription,
} from "@/lib/i18n-food";
import { Button } from "@/components/ui/button";
import { TrendingBadge } from "@/components/ShopCard";
import { ShopViewCount } from "@/components/ShopViewCount";
import { LikeButton } from "@/components/LikeButton";
import { MapEmbed } from "@/components/MapEmbed";
import { LinePayBadge } from "@/components/LinePayBadge";
import { CertifiedBadge } from "@/components/CertifiedBadge";

export const dynamic = "force-dynamic";

export default async function ShopDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const shop = await getShopById(params.id);
  if (!shop) notFound();

  const locale = await getLocale();
  const t = await getTranslations("detail");
  const name = localizedName(shop, locale);
  const secondary = secondaryName(shop, locale);
  const description = localizedDescription(shop, locale);
  const hasCoords =
    typeof shop.lat === "number" && typeof shop.lng === "number";

  return (
    <div className="pb-10">
      {/* Hero image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {shop.thumbnail_url ? (
          <Image
            src={shop.thumbnail_url}
            alt={name}
            fill
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            unoptimized={(shop.thumbnail_url.startsWith("/demo/") || shop.thumbnail_url.toLowerCase().endsWith(".svg"))}
            className="object-cover animate-photo"
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
        {shop.is_trending && (
          <div className="absolute right-3 top-3">
            <TrendingBadge />
          </div>
        )}
      </div>

      <div className="space-y-6 px-4 pt-5">
        {/* Title block */}
        <div className="space-y-2">
          {shop.price_range && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {shop.price_range}
              </span>
            </div>
          )}
          <h1 className="font-display text-xl font-extrabold uppercase tracking-tight gradient-text">
            {name}
          </h1>
          {secondary && (
            <p className="font-display text-sm uppercase tracking-wider text-muted-foreground">
              {secondary}
            </p>
          )}
          {description && (
            <p className="whitespace-pre-line leading-relaxed text-foreground/90">
              {description}
            </p>
          )}
          {shop.address && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {shop.address}
            </div>
          )}
          {(shop.district || shop.line_pay || shop.certified) && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {shop.district && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {shop.district}
                </span>
              )}
              {shop.certified && <CertifiedBadge className="px-2 py-1 text-[11px]" />}
              {shop.line_pay && <LinePayBadge className="px-2 py-1 text-[11px]" />}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
            <Eye className="size-4" />
            <ShopViewCount shopId={shop.id} initial={shop.view_count} />
          </div>
          <div className="pt-1">
            <LikeButton shopId={shop.id} initialCount={shop.like_count} />
          </div>
        </div>

        {shop.hashtags && shop.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {shop.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Menu — the shop's foods */}
        {shop.foods.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold uppercase tracking-wide">
              <span className="h-4 w-1 rounded-full bg-primary glow-sm" />
              {t("menu")}
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card/70 neon-border">
              {shop.foods.map((food) => {
                const foodName = localizedName(food, locale);
                const foodDescription = localizedDescription(food, locale);
                return (
                  <li key={food.id} className="flex gap-3 p-3">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {food.image_url ? (
                        <Image
                          src={food.image_url}
                          alt={foodName}
                          fill
                          sizes="80px"
                          unoptimized={(food.image_url.startsWith("/demo/") || food.image_url.toLowerCase().endsWith(".svg"))}
                          className="object-cover animate-photo"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">
                          🍢
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-semibold leading-tight">
                          {foodName}
                        </h3>
                        {food.price_range && (
                          <span className="shrink-0 text-sm font-bold text-primary">
                            {food.price_range}
                          </span>
                        )}
                      </div>
                      {foodDescription && (
                        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {foodDescription}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* YouTube Shorts — external link, no embedded streaming */}
        {shop.youtube_shorts_url && (
          <a
            href={shop.youtube_shorts_url}
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
            {shop.address && (
              <p className="text-sm text-muted-foreground">{shop.address}</p>
            )}
            <MapEmbed
              lat={shop.lat}
              lng={shop.lng}
              title={shop.name_ko}
              height="220px"
              className="overflow-hidden rounded-2xl neon-border"
            />
            <Button asChild className="w-full" size="lg">
              <a
                href={googleDirectionsUrl(shop)}
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
