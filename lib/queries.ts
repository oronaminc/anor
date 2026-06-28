import "server-only";
import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import type { Shop, ShopFood, ShopWithFoods } from "@/lib/types";
import { DEMO_SHOPS, isDemoMode } from "@/lib/demo-data";
import { totalViews, totalLikes } from "@/lib/counts";

export { totalViews, totalLikes };

/** Overwrite view_count/like_count with the displayed totals (real + synthetic)
 *  so every consumer just reads shop.view_count / shop.like_count. */
function withTotals(shop: Shop): Shop {
  return { ...shop, view_count: totalViews(shop), like_count: totalLikes(shop) };
}

/** Group menu foods (already globally ordered) under their shop. */
function attachFoods(shops: Shop[], foods: ShopFood[]): ShopWithFoods[] {
  const byShop = new Map<string, ShopFood[]>();
  for (const f of foods) {
    const arr = byShop.get(f.shop_id);
    if (arr) arr.push(f);
    else byShop.set(f.shop_id, [f]);
  }
  return shops.map((s) => ({ ...withTotals(s), foods: byShop.get(s.id) ?? [] }));
}

/**
 * Fetch all shops with their menu foods. The counts shown are exactly the
 * stored view_count / like_count — no computation, so every surface (home,
 * cards, detail) shows the same number, and it only moves on a real view/like.
 * Falls back to the demo dataset when there is no database.
 */
export async function getShops(): Promise<ShopWithFoods[]> {
  if (isDemoMode() || !hasDb()) return DEMO_SHOPS;
  try {
    const sql = getSql();
    const shops = (await sql`SELECT * FROM shops ORDER BY created_at DESC`) as Shop[];
    const foods = (await sql`
      SELECT * FROM shop_foods ORDER BY shop_id, sort_order
    `) as ShopFood[];
    return attachFoods(shops, foods);
  } catch (err) {
    console.error("getShops error:", err);
    return [];
  }
}

export async function getShopById(id: string): Promise<ShopWithFoods | null> {
  if (isDemoMode() || !hasDb()) {
    return DEMO_SHOPS.find((s) => s.id === id) ?? null;
  }
  try {
    const sql = getSql();
    const shops = (await sql`SELECT * FROM shops WHERE id = ${id} LIMIT 1`) as Shop[];
    const shop = shops[0];
    if (!shop) return null;
    const foods = (await sql`
      SELECT * FROM shop_foods WHERE shop_id = ${id} ORDER BY sort_order
    `) as ShopFood[];
    return { ...withTotals(shop), foods };
  } catch (err) {
    console.error("getShopById error:", err);
    return null;
  }
}
