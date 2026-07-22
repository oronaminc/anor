import Link from "next/link";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Plus, Pencil, Eye, Heart } from "lucide-react";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { totalViews, totalLikes } from "@/lib/counts";
import type { Product } from "@/lib/types";
import {
  RETAILERS,
  RETAILER_CODES,
  retailCategoryLabel,
  type Retailer,
} from "@/lib/retailers";
import { localizedName } from "@/lib/i18n-food";
import { formatViewCount, isUnoptimizedImage, photoAnim } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ProductTrendingToggle,
  ProductBoostButtons,
  DeleteProductButton,
} from "@/components/admin/ProductAdminControls";

export const dynamic = "force-dynamic";

async function getAllProducts(): Promise<Product[]> {
  if (!hasDb()) return [];
  try {
    const sql = getSql();
    const rows = (await sql`
      SELECT * FROM products
       ORDER BY retailer, (view_count + synthetic_view_count) DESC
    `) as Product[];
    return rows.map((p) => ({
      ...p,
      view_count: totalViews(p),
      like_count: totalLikes(p),
    }));
  } catch {
    return [];
  }
}

export default async function AdminProductsPage() {
  const configured = hasDb();
  const locale = await getLocale();
  const products = await getAllProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">화장품·굿즈 관리</h1>
          <p className="text-sm text-muted-foreground">
            올리브영 {products.filter((p) => p.retailer === "olive_young").length}개 ·
            다이소 {products.filter((p) => p.retailer === "daiso").length}개
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />새 상품
          </Link>
        </Button>
      </div>

      {!configured ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          데이터베이스(DATABASE_URL)가 연결되지 않았습니다.
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          등록된 상품이 없습니다. 우측 상단의 “새 상품”으로 추가해 보세요.
        </div>
      ) : (
        RETAILER_CODES.map((code) => {
          const list = products.filter((p) => p.retailer === code);
          if (list.length === 0) return null;
          return (
            <section key={code} className="space-y-2">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span>{RETAILERS[code as Retailer].emoji}</span>
                {RETAILERS[code as Retailer].ko}
                <span className="text-sm font-normal text-muted-foreground">
                  {list.length}개
                </span>
              </h2>
              <div className="overflow-hidden rounded-xl border bg-card">
                <ul className="divide-y">
                  {list.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 p-3 sm:gap-4">
                      <span className="w-5 shrink-0 text-center text-sm font-bold tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {p.thumbnail_url ? (
                          <Image
                            src={p.thumbnail_url}
                            alt={p.name_ko}
                            fill
                            sizes="56px"
                            unoptimized={isUnoptimizedImage(p.thumbnail_url)}
                            className={`object-cover ${photoAnim(p.id)}`}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            {RETAILERS[code as Retailer].emoji}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {localizedName(p, locale)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[
                            p.brand,
                            retailCategoryLabel(code as Retailer, p.category, locale),
                            p.price_range,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="size-3.5" />
                            {formatViewCount(p.view_count)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="size-3.5" />
                            {formatViewCount(p.like_count)}
                          </span>
                          <ProductTrendingToggle
                            productId={p.id}
                            isTrending={p.is_trending}
                          />
                        </div>
                        <div className="mt-2">
                          <ProductBoostButtons productId={p.id} />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label="수정">
                          <Link href={`/admin/products/${p.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <DeleteProductButton productId={p.id} name={p.name_ko} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
