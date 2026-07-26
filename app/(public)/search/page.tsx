import { getShops } from "@/lib/queries";
import { getProducts } from "@/lib/products";
import { SearchView } from "@/components/SearchView";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  // Search covers all three pillars, so the page ships every pillar's list and
  // filters client-side (same approach as the home feed and /map).
  const [shops, oliveYoung, daiso] = await Promise.all([
    getShops(),
    getProducts("olive_young"),
    getProducts("daiso"),
  ]);

  return <SearchView shops={shops} products={[...oliveYoung, ...daiso]} />;
}
