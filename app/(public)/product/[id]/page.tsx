import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Eye, MapPin } from "lucide-react";

import { getProductById, getRetailStores } from "@/lib/products";
import { isRetailer, retailCategoryLabel, retailerMeta, type Retailer } from "@/lib/retailers";
import { isUnoptimizedImage, photoAnim } from "@/lib/utils";
import {
  localizedName,
  secondaryName,
  localizedDescription,
  localizedPrice,
} from "@/lib/i18n-food";
import { TrendingBadge } from "@/components/ShopCard";
import { RetailerBadge } from "@/components/RetailerBadge";
import { ProductViewCount } from "@/components/ProductViewCount";
import { ProductLikeButton } from "@/components/ProductLikeButton";
import { ShareButton } from "@/components/ShareButton";
import GoogleMap from "@/components/GoogleMap";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductById(params.id);
  if (!product) notFound();

  const locale = await getLocale();
  const t = await getTranslations("detail");
  const tr = await getTranslations("retail");
  const name = localizedName(product, locale);
  const secondary = secondaryName(product, locale);
  const description = localizedDescription(product, locale);
  const meta = retailerMeta(product.retailer);

  const stores = isRetailer(product.retailer)
    ? await getRetailStores(product.retailer as Retailer)
    : [];
  const storePoints = stores
    .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
    .map((s) => ({
      id: s.id,
      name_ko: s.name_ko,
      name_ja: s.name_ja,
      name_en: null,
      name_es: null,
      lat: s.lat,
      lng: s.lng,
    }));

  const backHref = meta?.href ?? "/";

  return (
    <div className="pb-10">
      {/* Hero image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={name}
            fill
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            unoptimized={isUnoptimizedImage(product.thumbnail_url)}
            className={`object-cover ${photoAnim(product.id)}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl">
            {meta?.emoji ?? "🛍️"}
          </div>
        )}
        <Link
          href={backHref}
          aria-label="Back"
          className="absolute left-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
        >
          <ArrowLeft className="size-5" />
        </Link>
        {product.is_trending && (
          <div className="absolute right-3 top-3">
            <TrendingBadge />
          </div>
        )}
      </div>

      <div className="space-y-6 px-4 pt-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <RetailerBadge retailer={product.retailer} className="px-2 py-1 text-[11px]" />
            {product.category && (
              <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {isRetailer(product.retailer)
                  ? retailCategoryLabel(product.retailer as Retailer, product.category, locale)
                  : product.category}
              </span>
            )}
            {product.price_range && (
              <span className="text-sm font-bold text-foreground">
                {localizedPrice(product.price_range, locale)}
              </span>
            )}
          </div>
          {product.brand && (
            <p className="text-sm font-semibold text-muted-foreground">{product.brand}</p>
          )}
          <h1 className="text-xl font-extrabold leading-tight tracking-tight">{name}</h1>
          {secondary && (
            <p className="text-sm text-muted-foreground">{secondary}</p>
          )}
          {description && (
            <p className="whitespace-pre-line leading-relaxed text-foreground/90">
              {description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
            <Eye className="size-4" />
            <ProductViewCount productId={product.id} initial={product.view_count} />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <ProductLikeButton productId={product.id} initialCount={product.like_count} />
            {product.short_id != null && (
              <ShareButton
                shortId={product.short_id}
                basePath="/p"
                name={name}
                label={t("share")}
                copied={t("copied")}
              />
            )}
          </div>
        </div>

        {/* Where to buy — the retailer's Myeongdong stores */}
        {storePoints.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold uppercase tracking-wide">
              <MapPin className="size-5 text-primary" />
              {tr("buyAt", { retailer: locale === "ja" ? meta?.ja ?? "" : meta?.ko ?? "" })}
            </h2>
            <GoogleMap
              shops={storePoints}
              height="220px"
              zoom={16}
              className="overflow-hidden rounded-2xl border border-border"
            />
            <ul className="space-y-1.5">
              {stores.map((s) => (
                <li key={s.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {locale === "ja" ? s.name_ja || s.name_ko : s.name_ko}
                  </span>
                  {s.address ? ` · ${s.address}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
