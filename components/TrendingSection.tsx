import type { Food } from "@/lib/types";
import { sortFoods } from "@/lib/sort";
import { FoodCard } from "@/components/FoodCard";

export function TrendingSection({ foods }: { foods: Food[] }) {
  const trending = sortFoods(
    foods.filter((f) => f.is_trending),
    "popular",
  );
  if (trending.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-bold">🔥 지금 뜨는 길거리 음식</h2>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {trending.map((food, i) => (
          <div
            key={food.id}
            className="w-40 shrink-0 snap-start sm:w-48"
          >
            <FoodCard food={food} rank={i + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
