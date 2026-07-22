import "server-only";
import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { isDemoMode } from "@/lib/demo-data";
import { DEMO_PRODUCTS, DEMO_RETAIL_STORES } from "@/lib/products-demo";
import { totalViews, totalLikes } from "@/lib/counts";
import type { Product, RetailStore } from "@/lib/types";
import { isRetailer, type Retailer } from "@/lib/retailers";

/** Overwrite the stored counts with the displayed totals (real + synthetic). */
function withTotals(p: Product): Product {
  return { ...p, view_count: totalViews(p), like_count: totalLikes(p) };
}

/** All products for a retailer, ranked by views desc (trending pinned first). */
export async function getProducts(retailer: Retailer): Promise<Product[]> {
  if (isDemoMode() || !hasDb()) {
    return DEMO_PRODUCTS.filter((p) => p.retailer === retailer).map(withTotals);
  }
  try {
    const sql = getSql();
    const rows = (await sql`
      SELECT * FROM products WHERE retailer = ${retailer}
       ORDER BY (view_count + synthetic_view_count) DESC, created_at DESC
    `) as Product[];
    return rows.map(withTotals);
  } catch (err) {
    console.error("getProducts error:", err);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isDemoMode() || !hasDb()) {
    const p = DEMO_PRODUCTS.find((x) => x.id === id);
    return p ? withTotals(p) : null;
  }
  try {
    const sql = getSql();
    const rows = (await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1`) as Product[];
    return rows[0] ? withTotals(rows[0]) : null;
  } catch (err) {
    console.error("getProductById error:", err);
    return null;
  }
}

/** Resolve a product's UUID from its short numeric id (for /p/{n} links). */
export async function getProductIdByShortId(shortId: number): Promise<string | null> {
  if (isDemoMode() || !hasDb()) {
    return DEMO_PRODUCTS.find((p) => p.short_id === shortId)?.id ?? null;
  }
  try {
    const sql = getSql();
    const rows = (await sql`SELECT id FROM products WHERE short_id = ${shortId} LIMIT 1`) as {
      id: string;
    }[];
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error("getProductIdByShortId error:", err);
    return null;
  }
}

/** The retailer's Myeongdong stores — the "where to buy" map points. */
export async function getRetailStores(retailer: Retailer): Promise<RetailStore[]> {
  if (isDemoMode() || !hasDb()) {
    return DEMO_RETAIL_STORES.filter((s) => s.retailer === retailer);
  }
  try {
    const sql = getSql();
    return (await sql`
      SELECT id, retailer, name_ko, name_ja, lat, lng, address
        FROM retail_stores WHERE retailer = ${retailer} ORDER BY created_at
    `) as RetailStore[];
  } catch (err) {
    console.error("getRetailStores error:", err);
    return [];
  }
}

export { isRetailer };
