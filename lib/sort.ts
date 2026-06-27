import type { Food, SortKey } from "./types";

/**
 * Sort foods by the chosen key.
 *  - "popular": highest view_count first
 *  - "latest":  newest created_at first
 * With `trendingFirst`, every `is_trending` item is pinned above
 * non-trending ones regardless of the key (e.g. the home feed) — within each
 * group the key still applies. Returns a new array (does not mutate input).
 */
export function sortFoods(
  foods: Food[],
  key: SortKey,
  opts: { trendingFirst?: boolean } = {},
): Food[] {
  const byKey =
    key === "popular"
      ? (a: Food, b: Food) => b.view_count - a.view_count
      : (a: Food, b: Food) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  return [...foods].sort((a, b) => {
    if (opts.trendingFirst && a.is_trending !== b.is_trending) {
      return a.is_trending ? -1 : 1;
    }
    return byKey(a, b);
  });
}

/**
 * Build the weekly-style ranking: top N foods by view_count.
 * Each entry carries its 1-based rank.
 */
export function rankByViews(
  foods: Food[],
  limit = 5,
): Array<{ rank: number; food: Food }> {
  return sortFoods(foods, "popular")
    .slice(0, limit)
    .map((food, i) => ({ rank: i + 1, food }));
}

/**
 * Case-insensitive search across name (ko/en), category and hashtags.
 * Empty/blank query returns the list unchanged.
 */
export function filterFoods(foods: Food[], query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return foods;
  return foods.filter((food) => {
    const haystack = [
      food.name_ko,
      food.name_en ?? "",
      food.name_ja ?? "",
      food.name_es ?? "",
      food.category ?? "",
      ...(food.hashtags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
