import { getFoods } from "@/lib/queries";
import { SearchView } from "@/components/SearchView";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const foods = await getFoods();
  return <SearchView foods={foods} />;
}
