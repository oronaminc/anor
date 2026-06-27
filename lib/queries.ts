import "server-only";
import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import type { Shop, ShopFood, ShopWithFoods } from "@/lib/types";
import { DEMO_SHOPS, isDemoMode } from "@/lib/demo-data";
import { computeDisplay, getGrowthSpeed, organicRatePerMin } from "@/lib/growth";

/** Group menu foods (already globally ordered) under their shop. */
function attachFoods(shops: Shop[], foods: ShopFood[]): ShopWithFoods[] {
  const byShop = new Map<string, ShopFood[]>();
  for (const f of foods) {
    const arr = byShop.get(f.shop_id);
    if (arr) arr.push(f);
    else byShop.set(f.shop_id, [f]);
  }
  return shops.map((s) => ({ ...s, foods: byShop.get(s.id) ?? [] }));
}

/**
 * Public view/like numbers are THIS WEEK's count + time-based organic growth.
 * We overwrite view_count/like_count with the displayed values so every public
 * component shows the weekly figure (admin/analytics read the raw columns
 * directly, not through here).
 */
function withDisplay(shop: Shop, speed: number, now: number): Shop {
  const { views, likes } = computeDisplay(shop, speed, now);
  const rate = organicRatePerMin(shop, speed);
  return {
    ...shop,
    view_count: views,
    like_count: likes,
    view_rate_per_min: rate.views,
    like_rate_per_min: rate.likes,
  };
}

/**
 * Fetch all shops with their menu foods. Resilient by design: when no database
 * is configured (DATABASE_URL absent) OR demo mode is forced, returns the
 * built-in demo dataset so the app shows content with zero setup. With Neon
 * configured it always uses the real database.
 */
export async function getShops(): Promise<ShopWithFoods[]> {
  if (isDemoMode() || !hasDb()) return DEMO_SHOPS;
  try {
    const sql = getSql();
    const shops = (await sql`SELECT * FROM shops ORDER BY created_at DESC`) as Shop[];
    const foods = (await sql`
      SELECT * FROM shop_foods ORDER BY shop_id, sort_order
    `) as ShopFood[];
    const speed = await getGrowthSpeed(sql);
    const now = Date.now();
    return attachFoods(
      shops.map((s) => withDisplay(s, speed, now)),
      foods,
    );
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
    const speed = await getGrowthSpeed(sql);
    return { ...withDisplay(shop, speed, Date.now()), foods };
  } catch (err) {
    console.error("getShopById error:", err);
    return null;
  }
}
