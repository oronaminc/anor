import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Food } from "@/lib/types";
import { DEMO_FOODS, isDemoMode } from "@/lib/demo-data";

function hasSupabaseEnv() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );
}

/**
 * Fetch all foods. Resilient by design: when Supabase is not configured
 * (e.g. a fresh sample deploy) OR demo mode is forced, returns the built-in
 * demo dataset so the app shows content with zero setup. With Supabase
 * configured it always uses the real database.
 */
export async function getFoods(): Promise<Food[]> {
  if (isDemoMode() || !hasSupabaseEnv()) return DEMO_FOODS;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getFoods error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("getFoods exception:", err);
    return [];
  }
}

export async function getFoodById(id: string): Promise<Food | null> {
  if (isDemoMode() || !hasSupabaseEnv()) {
    return DEMO_FOODS.find((f) => f.id === id) ?? null;
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("getFoodById error:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("getFoodById exception:", err);
    return null;
  }
}
