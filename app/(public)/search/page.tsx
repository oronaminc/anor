import { getShops } from "@/lib/queries";
import { SearchView } from "@/components/SearchView";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const shops = await getShops();
  return <SearchView shops={shops} />;
}
