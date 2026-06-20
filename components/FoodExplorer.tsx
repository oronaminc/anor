"use client";

import { useMemo, useState } from "react";
import { Search, TrendingUp, Clock } from "lucide-react";

import type { Food, SortKey } from "@/lib/types";
import { sortFoods, filterFoods } from "@/lib/sort";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FoodCard } from "@/components/FoodCard";

export function FoodExplorer({ foods }: { foods: Food[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");

  const visible = useMemo(() => {
    return sortFoods(filterFoods(foods, query), sort);
  }, [foods, query, sort]);

  return (
    <section id="explore" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">전체 메뉴</h2>
        <span className="text-sm text-muted-foreground">
          {visible.length}개
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="음식 이름, 해시태그, 카테고리 검색"
          className="pl-9"
          aria-label="음식 검색"
          type="search"
        />
      </div>

      {/* Sort toggle */}
      <div
        role="tablist"
        aria-label="정렬"
        className="inline-flex rounded-lg border bg-muted/40 p-1"
      >
        <SortButton
          active={sort === "popular"}
          onClick={() => setSort("popular")}
          icon={<TrendingUp className="size-4" />}
          label="인기순"
        />
        <SortButton
          active={sort === "latest"}
          onClick={() => setSort("latest")}
          icon={<Clock className="size-4" />}
          label="최신순"
        />
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          검색 결과가 없습니다 🥲
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </section>
  );
}

function SortButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
