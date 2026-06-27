import "server-only";
import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import type { Food } from "@/lib/types";
import { DEMO_FOODS, isDemoMode } from "@/lib/demo-data";

/**
 * Fetch all foods. Resilient by design: when no database is configured
 * (DATABASE_URL absent) OR demo mode is forced, returns the built-in demo
 * dataset so the app shows content with zero setup. With Neon configured it
 * always uses the real database.
 */
export async function getFoods(): Promise<Food[]> {
  if (isDemoMode() || !hasDb()) return DEMO_FOODS;
  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM foods ORDER BY created_at DESC`;
    return rows as Food[];
  } catch (err) {
    console.error("getFoods error:", err);
    return [];
  }
}

export async function getFoodById(id: string): Promise<Food | null> {
  if (isDemoMode() || !hasDb()) {
    return DEMO_FOODS.find((f) => f.id === id) ?? null;
  }
  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM foods WHERE id = ${id} LIMIT 1`;
    return (rows[0] as Food) ?? null;
  } catch (err) {
    console.error("getFoodById error:", err);
    return null;
  }
}
