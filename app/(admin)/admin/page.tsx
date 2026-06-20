import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Eye } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { Food } from "@/lib/types";
import { formatViewCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TrendingToggle } from "@/components/admin/TrendingToggle";
import { DeleteFoodButton } from "@/components/admin/DeleteFoodButton";

export const dynamic = "force-dynamic";

async function getAllFoods(): Promise<Food[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("foods")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AdminDashboard() {
  const foods = await getAllFoods();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">음식 관리</h1>
          <p className="text-sm text-muted-foreground">
            전체 {foods.length}개 · 급상승{" "}
            {foods.filter((f) => f.is_trending).length}개
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/foods/new">
            <Plus className="size-4" />새 음식
          </Link>
        </Button>
      </div>

      {foods.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          등록된 음식이 없습니다. 우측 상단의 “새 음식”으로 추가해 보세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {foods.map((food) => (
              <li
                key={food.id}
                className="flex items-center gap-3 p-3 sm:gap-4"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {food.thumbnail_url ? (
                    <Image
                      src={food.thumbnail_url}
                      alt={food.name_ko}
                      fill
                      sizes="56px"
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
                    {food.category ?? "-"} · {food.price_range ?? "-"}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3.5" />
                      {formatViewCount(food.view_count)}
                    </span>
                    <TrendingToggle
                      id={food.id}
                      isTrending={food.is_trending}
                    />
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="ghost" size="icon" aria-label="수정">
                    <Link href={`/admin/foods/${food.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <DeleteFoodButton id={food.id} name={food.name_ko} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
