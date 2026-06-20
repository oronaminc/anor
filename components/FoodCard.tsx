import Link from "next/link";
import Image from "next/image";
import { Eye, MapPin } from "lucide-react";

import type { Food } from "@/lib/types";
import { formatViewCount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { HashtagChips } from "@/components/HashtagChips";

export function TrendingBadge({ rank }: { rank?: number }) {
  // Top 1-2 → 🔥 HOT, otherwise ⬆️ 급상승
  const hot = typeof rank === "number" ? rank <= 2 : false;
  return (
    <Badge
      variant={hot ? "default" : "accent"}
      className="gap-1 shadow-sm"
    >
      {hot ? "🔥 HOT" : "⬆️ 급상승"}
    </Badge>
  );
}

export function FoodCard({
  food,
  rank,
}: {
  food: Food;
  rank?: number;
}) {
  return (
    <Link
      href={`/food/${food.id}`}
      className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {food.thumbnail_url ? (
          <Image
            src={food.thumbnail_url}
            alt={food.name_ko}
            fill
            sizes="(max-width: 480px) 50vw, 240px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            🍢
          </div>
        )}
        {food.is_trending && (
          <div className="absolute left-2 top-2">
            <TrendingBadge rank={rank} />
          </div>
        )}
        {food.category && (
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className="bg-white/85 backdrop-blur">
              {food.category}
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-base font-bold">{food.name_ko}</h3>
          {food.price_range && (
            <span className="shrink-0 text-xs font-semibold text-primary">
              {food.price_range}
            </span>
          )}
        </div>

        {food.name_en && (
          <p className="truncate text-xs text-muted-foreground">
            {food.name_en}
          </p>
        )}

        <HashtagChips hashtags={food.hashtags} limit={3} />

        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" />
            {formatViewCount(food.view_count)}
          </span>
          {food.address && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{food.address}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
