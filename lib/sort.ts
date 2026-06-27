import type { Shop, ShopWithFoods, SortKey } from "./types";

type Sortable = Pick<Shop, "view_count" | "created_at" | "is_trending">;

/**
 * Sort shops by the chosen key.
 *  - "popular": highest view_count first
 *  - "latest":  newest created_at first
 * With `trendingFirst`, every `is_trending` shop is pinned above non-trending
 * ones regardless of the key (e.g. the home feed) — within each group the key
 * still applies. Returns a new array (does not mutate input).
 */
export function sortShops<T extends Sortable>(
  shops: T[],
  key: SortKey,
  opts: { trendingFirst?: boolean } = {},
): T[] {
  const byKey =
    key === "popular"
      ? (a: Sortable, b: Sortable) => b.view_count - a.view_count
      : (a: Sortable, b: Sortable) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  return [...shops].sort((a, b) => {
    if (opts.trendingFirst && a.is_trending !== b.is_trending) {
      return a.is_trending ? -1 : 1;
    }
    return byKey(a, b);
  });
}

/**
 * Build the weekly-style ranking: top N shops by view_count.
 * Each entry carries its 1-based rank.
 */
export function rankByViews<T extends Sortable>(
  shops: T[],
  limit = 5,
): Array<{ rank: number; shop: T }> {
  return sortShops(shops, "popular")
    .slice(0, limit)
    .map((shop, i) => ({ rank: i + 1, shop }));
}

/**
 * Case-insensitive search across the shop's names, address, hashtags AND the
 * names of every menu food it serves. Empty/blank query returns the list as-is.
 */
export function filterShops(
  shops: ShopWithFoods[],
  query: string,
): ShopWithFoods[] {
  const q = query.trim().toLowerCase();
  if (!q) return shops;
  return shops.filter((shop) => {
    const haystack = [
      shop.name_ko,
      shop.name_en ?? "",
      shop.name_ja ?? "",
      shop.name_es ?? "",
      shop.address ?? "",
      ...(shop.hashtags ?? []),
      ...shop.foods.flatMap((f) => [
        f.name_ko,
        f.name_en ?? "",
        f.name_ja ?? "",
        f.name_es ?? "",
      ]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
