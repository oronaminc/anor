import Link from "next/link";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Plus, Pencil, Eye, Heart } from "lucide-react";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { totalViews, totalLikes } from "@/lib/queries";
import type { Shop } from "@/lib/types";
import { localizedName } from "@/lib/i18n-food";
import { formatViewCount, isUnoptimizedImage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TrendingToggle } from "@/components/admin/TrendingToggle";
import { DeleteShopButton } from "@/components/admin/DeleteShopButton";
import { BoostButtons } from "@/components/admin/BoostButtons";

export const dynamic = "force-dynamic";

async function getAllShops(): Promise<Shop[]> {
  if (!hasDb()) return [];
  try {
    const sql = getSql();
    const rows = (await sql`SELECT * FROM shops ORDER BY created_at DESC`) as Shop[];
    // Show the same total (real + synthetic) the public sees.
    return rows.map((s) => ({
      ...s,
      view_count: totalViews(s),
      like_count: totalLikes(s),
    }));
  } catch {
    return [];
  }
}

export default async function AdminDashboard() {
  const configured = hasDb();
  const locale = await getLocale();
  const shops = await getAllShops();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">가게 관리</h1>
          <p className="text-sm text-muted-foreground">
            전체 {shops.length}개 · 급상승{" "}
            {shops.filter((s) => s.is_trending).length}개
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/shops/new">
            <Plus className="size-4" />새 가게
          </Link>
        </Button>
      </div>

      {!configured ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          데이터베이스(DATABASE_URL)가 연결되지 않았습니다. 배포 환경에서 Neon
          연결 문자열을 설정하면 가게 관리가 활성화됩니다. (DEPLOY.md 참고)
        </div>
      ) : shops.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          등록된 가게가 없습니다. 우측 상단의 “새 가게”로 추가해 보세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {shops.map((shop) => (
              <li
                key={shop.id}
                className="flex items-center gap-3 p-3 sm:gap-4"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {shop.thumbnail_url ? (
                    <Image
                      src={shop.thumbnail_url}
                      alt={shop.name_ko}
                      fill
                      sizes="56px"
                      unoptimized={isUnoptimizedImage(shop.thumbnail_url)}
                      className="object-cover animate-photo"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      🍢
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {localizedName(shop, locale)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {shop.price_range ?? "-"}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3.5" />
                      {formatViewCount(shop.view_count)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="size-3.5" />
                      {formatViewCount(shop.like_count)}
                    </span>
                    <TrendingToggle
                      shopId={shop.id}
                      isTrending={shop.is_trending}
                    />
                  </div>
                  <div className="mt-2">
                    <BoostButtons shopId={shop.id} />
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="ghost" size="icon" aria-label="수정">
                    <Link href={`/admin/shops/${shop.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <DeleteShopButton shopId={shop.id} name={shop.name_ko} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
