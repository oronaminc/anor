import "server-only";
import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { CACHE_TAGS, cachedRead } from "@/lib/cache";
import type { Shop, ShopFood, ShopWithFoods } from "@/lib/types";
import { DEMO_SHOPS, isDemoMode } from "@/lib/demo-data";
import { totalViews, totalLikes } from "@/lib/counts";

export { totalViews, totalLikes };

/** A shop row joined with its zone's coordinates. */
type ShopRow = Shop & { zone_lat: number | null; zone_lng: number | null };

/**
 * Derive the displayed shop: counts become the totals (real + synthetic), and
 * the LOCATION comes from the shop's zone (districts). The zone is the single
 * source of location — a shop only stores its `district` code, so changing a
 * zone's coordinates moves every shop in it. Falls back to the shop's own
 * lat/lng if it isn't assigned to a (known) zone.
 */
function withDerived(row: ShopRow): Shop {
  const { zone_lat, zone_lng, ...shop } = row;
  return {
    ...shop,
    view_count: totalViews(shop),
    like_count: totalLikes(shop),
    lat: zone_lat ?? shop.lat,
    lng: zone_lng ?? shop.lng,
  };
}

/** Group menu foods (already globally ordered) under their shop. */
function attachFoods(shops: ShopRow[], foods: ShopFood[]): ShopWithFoods[] {
  const byShop = new Map<string, ShopFood[]>();
  for (const f of foods) {
    const arr = byShop.get(f.shop_id);
    if (arr) arr.push(f);
    else byShop.set(f.shop_id, [f]);
  }
  return shops.map((s) => ({ ...withDerived(s), foods: byShop.get(s.id) ?? [] }));
}

/**
 * The loaders below are wrapped in the shared Data Cache (see lib/cache.ts), so
 * ordinary page views don't re-query — and the database's compute can suspend.
 *
 * They deliberately THROW instead of returning a fallback: a rejected promise is
 * not stored, so a transient outage can't get cached and blank the site for the
 * whole TTL. The exported functions below catch and fall back.
 */
const loadShops = cachedRead(
  ["shops:all"],
  async (): Promise<ShopWithFoods[]> => {
    const sql = getSql();
    const shops = (await sql`
      SELECT s.*, d.lat AS zone_lat, d.lng AS zone_lng
        FROM shops s
        LEFT JOIN districts d ON d.name = s.district
       ORDER BY s.created_at DESC
    `) as ShopRow[];
    const foods = (await sql`
      SELECT * FROM shop_foods ORDER BY shop_id, sort_order
    `) as ShopFood[];
    return attachFoods(shops, foods);
  },
  [CACHE_TAGS.shops],
);

/**
 * Fetch all shops with their menu foods. Counts are the stored totals; location
 * is resolved from each shop's zone. Falls back to the demo dataset with no DB.
 */
export async function getShops(): Promise<ShopWithFoods[]> {
  if (isDemoMode() || !hasDb()) return DEMO_SHOPS;
  try {
    return await loadShops();
  } catch (err) {
    console.error("getShops error:", err);
    return [];
  }
}

const loadShopIdByShortId = cachedRead(
  ["shops:by-short-id"],
  async (shortId: number): Promise<string | null> => {
    const sql = getSql();
    const rows = (await sql`
      SELECT id FROM shops WHERE short_id = ${shortId} LIMIT 1
    `) as { id: string }[];
    return rows[0]?.id ?? null;
  },
  [CACHE_TAGS.shops],
);

/** Resolve a shop's UUID from a short numeric id (for /s/{n} share links). */
export async function getShopIdByShortId(shortId: number): Promise<string | null> {
  if (isDemoMode() || !hasDb()) {
    return DEMO_SHOPS.find((s) => s.short_id === shortId)?.id ?? null;
  }
  try {
    return await loadShopIdByShortId(shortId);
  } catch (err) {
    console.error("getShopIdByShortId error:", err);
    return null;
  }
}

const loadShopById = cachedRead(
  ["shops:by-id"],
  async (id: string): Promise<ShopWithFoods | null> => {
    const sql = getSql();
    const shops = (await sql`
      SELECT s.*, d.lat AS zone_lat, d.lng AS zone_lng
        FROM shops s
        LEFT JOIN districts d ON d.name = s.district
       WHERE s.id = ${id}
       LIMIT 1
    `) as ShopRow[];
    const shop = shops[0];
    if (!shop) return null;
    const foods = (await sql`
      SELECT * FROM shop_foods WHERE shop_id = ${id} ORDER BY sort_order
    `) as ShopFood[];
    return { ...withDerived(shop), foods };
  },
  [CACHE_TAGS.shops],
);

export async function getShopById(id: string): Promise<ShopWithFoods | null> {
  if (isDemoMode() || !hasDb()) {
    return DEMO_SHOPS.find((s) => s.id === id) ?? null;
  }
  try {
    return await loadShopById(id);
  } catch (err) {
    console.error("getShopById error:", err);
    return null;
  }
}
