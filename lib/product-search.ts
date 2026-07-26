import type { Product } from "./types";
import { isRetailer, retailCategoryLabel } from "./retailers";

/**
 * Case-insensitive product search. The haystack deliberately holds BOTH
 * languages (ko + ja + en name, brand, and the category label in ko AND ja) so
 * a Japanese user typing Japanese and a Korean user typing Korean both match
 * the same row. Empty/blank query returns the list as-is.
 *
 * Pure + isomorphic (no DB) — used by the retailer ranking pages and by the
 * unified /search screen.
 */
export function filterProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) => {
    const cat = isRetailer(p.retailer)
      ? [
          retailCategoryLabel(p.retailer, p.category, "ko"),
          retailCategoryLabel(p.retailer, p.category, "ja"),
        ]
      : [];
    const haystack = [p.name_ko, p.name_ja, p.name_en, p.brand, ...cat]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
