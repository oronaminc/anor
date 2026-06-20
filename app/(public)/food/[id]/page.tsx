import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, MapPin, Youtube, Navigation } from "lucide-react";

import { getFoodById } from "@/lib/queries";
import { formatViewCount } from "@/lib/utils";
import { kakaoDirectionsUrl } from "@/lib/maps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HashtagChips } from "@/components/HashtagChips";
import { TrendingBadge } from "@/components/FoodCard";
import { ViewTracker } from "@/components/ViewTracker";
import KakaoMap from "@/components/KakaoMap";

export const dynamic = "force-dynamic";

export default async function FoodDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const food = await getFoodById(params.id);
  if (!food) notFound();

  const hasCoords =
    typeof food.lat === "number" && typeof food.lng === "number";

  return (
    <div className="pb-12">
      <ViewTracker foodId={food.id} />

      {/* Hero image */}
      <div className="relative aspect-[4/3] w-full bg-muted">
        {food.thumbnail_url ? (
          <Image
            src={food.thumbnail_url}
            alt={food.name_ko}
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
        <Link
          href="/"
          aria-label="뒤로 가기"
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

      <div className="space-y-6 px-4 pt-4">
        {/* Title block */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {food.category && (
              <Badge variant="secondary">{food.category}</Badge>
            )}
            {food.price_range && (
              <span className="text-sm font-semibold text-primary">
                {food.price_range}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold">{food.name_ko}</h1>
          {food.name_en && (
            <p className="text-sm text-muted-foreground">{food.name_en}</p>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="size-4" />
            조회수 {formatViewCount(food.view_count)}
          </div>
        </div>

        <HashtagChips hashtags={food.hashtags} />

        {food.description && (
          <p className="whitespace-pre-line leading-relaxed text-foreground/90">
            {food.description}
          </p>
        )}

        {/* YouTube Shorts — external link, no embedded streaming */}
        {food.youtube_shorts_url && (
          <a
            href={food.youtube_shorts_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-3 font-semibold">
              <Youtube className="size-6 text-red-600" />
              유튜브 쇼츠로 보기
            </span>
            <span className="text-sm text-muted-foreground">열기 ↗</span>
          </a>
        )}

        {/* Location + map */}
        {hasCoords && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h2 className="text-lg font-bold">위치</h2>
            </div>
            {food.address && (
              <p className="text-sm text-muted-foreground">{food.address}</p>
            )}
            <KakaoMap
              foods={[food]}
              height="240px"
              level={3}
              className="overflow-hidden rounded-xl border"
            />
            <Button asChild className="w-full" size="lg">
              <a
                href={kakaoDirectionsUrl(food)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="size-5" />
                길찾기
              </a>
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
