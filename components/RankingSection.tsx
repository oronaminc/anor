import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";

import type { Food } from "@/lib/types";
import { rankByViews } from "@/lib/sort";
import { formatViewCount } from "@/lib/utils";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function RankingSection({ foods }: { foods: Food[] }) {
  const ranking = rankByViews(foods, 5);
  if (ranking.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-bold">주간 랭킹</h2>
        <span className="text-xs text-muted-foreground">조회수 TOP 5</span>
      </div>

      <ol className="divide-y rounded-xl border bg-card">
        {ranking.map(({ rank, food }) => (
          <li key={food.id}>
            <Link
              href={`/food/${food.id}`}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
            >
              <span className="w-6 shrink-0 text-center text-lg font-bold tabular-nums">
                {MEDALS[rank] ?? rank}
              </span>
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {food.thumbnail_url ? (
                  <Image
                    src={food.thumbnail_url}
                    alt={food.name_ko}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    🍢
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{food.name_ko}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {food.category}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground">
                <Eye className="size-4" />
                {formatViewCount(food.view_count)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
