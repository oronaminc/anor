import { describe, it, expect } from "vitest";

import { sortFoods, rankByViews, filterFoods } from "@/lib/sort";
import { formatViewCount } from "@/lib/utils";
import type { Food } from "@/lib/types";

function makeFood(overrides: Partial<Food>): Food {
  return {
    id: crypto.randomUUID(),
    name_ko: "테스트",
    name_en: null,
    name_ja: null,
    name_es: null,
    description: null,
    translations: null,
    category: null,
    lat: null,
    lng: null,
    address: null,
    youtube_shorts_url: null,
    thumbnail_url: null,
    hashtags: [],
    view_count: 0,
    is_trending: false,
    price_range: null,
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const sample: Food[] = [
  makeFood({
    name_ko: "떡볶이",
    name_en: "Tteokbokki",
    category: "분식",
    hashtags: ["매콤", "명동맛집"],
    view_count: 100,
    created_at: "2024-01-01T00:00:00.000Z",
  }),
  makeFood({
    name_ko: "호떡",
    name_en: "Hotteok",
    category: "간식",
    hashtags: ["달달"],
    view_count: 300,
    created_at: "2024-03-01T00:00:00.000Z",
  }),
  makeFood({
    name_ko: "계란빵",
    name_en: "Gyeranppang",
    category: "간식",
    hashtags: ["고소함"],
    view_count: 200,
    created_at: "2024-02-01T00:00:00.000Z",
  }),
];

describe("sortFoods", () => {
  it("sorts by view_count desc for 'popular'", () => {
    const result = sortFoods(sample, "popular");
    expect(result.map((f) => f.view_count)).toEqual([300, 200, 100]);
  });

  it("sorts by created_at desc for 'latest'", () => {
    const result = sortFoods(sample, "latest");
    expect(result.map((f) => f.name_ko)).toEqual(["호떡", "계란빵", "떡볶이"]);
  });

  it("does not mutate the input array", () => {
    const before = sample.map((f) => f.view_count);
    sortFoods(sample, "popular");
    expect(sample.map((f) => f.view_count)).toEqual(before);
  });
});

describe("rankByViews", () => {
  it("assigns 1-based ranks ordered by views", () => {
    const ranking = rankByViews(sample, 2);
    expect(ranking).toHaveLength(2);
    expect(ranking[0]).toMatchObject({ rank: 1 });
    expect(ranking[0].food.name_ko).toBe("호떡");
    expect(ranking[1]).toMatchObject({ rank: 2 });
    expect(ranking[1].food.name_ko).toBe("계란빵");
  });
});

describe("filterFoods", () => {
  it("returns all when query is blank", () => {
    expect(filterFoods(sample, "   ")).toHaveLength(3);
  });

  it("matches by korean name", () => {
    expect(filterFoods(sample, "호떡").map((f) => f.name_ko)).toEqual(["호떡"]);
  });

  it("matches by english name case-insensitively", () => {
    expect(filterFoods(sample, "BOKKI").map((f) => f.name_ko)).toEqual([
      "떡볶이",
    ]);
  });

  it("matches by hashtag", () => {
    expect(filterFoods(sample, "매콤").map((f) => f.name_ko)).toEqual([
      "떡볶이",
    ]);
  });

  it("matches by category", () => {
    expect(filterFoods(sample, "간식").map((f) => f.name_ko).sort()).toEqual(
      ["계란빵", "호떡"].sort(),
    );
  });
});

describe("formatViewCount", () => {
  it("formats small numbers as-is", () => {
    expect(formatViewCount(0)).toBe("0");
    expect(formatViewCount(999)).toBe("999");
  });

  it("formats thousands with 천", () => {
    expect(formatViewCount(1500)).toBe("1.5천");
    expect(formatViewCount(2000)).toBe("2천");
  });

  it("formats ten-thousands with 만", () => {
    expect(formatViewCount(12000)).toBe("1.2만");
    expect(formatViewCount(30000)).toBe("3만");
  });
});
