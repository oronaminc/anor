import { describe, it, expect } from "vitest";

import { sortShops, rankByViews, filterShops } from "@/lib/sort";
import type { ShopFood, ShopWithFoods } from "@/lib/types";

function makeFood(over: Partial<ShopFood>): ShopFood {
  return {
    id: crypto.randomUUID(),
    shop_id: "s",
    name_ko: "음식",
    name_en: null,
    name_ja: null,
    name_es: null,
    description: null,
    translations: null,
    image_url: null,
    price_range: null,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function makeShop(over: Partial<ShopWithFoods>): ShopWithFoods {
  return {
    id: crypto.randomUUID(),
    name_ko: "가게",
    name_en: null,
    name_ja: null,
    name_es: null,
    description: null,
    translations: null,
    lat: null,
    lng: null,
    address: null,
    youtube_shorts_url: null,
    thumbnail_url: null,
    hashtags: [],
    price_range: null,
    view_count: 0,
    like_count: 0,
    weekly_view_count: 0,
    weekly_like_count: 0,
    week_start: "2026-06-22",
    growth_weight: 1,
    is_trending: false,
    created_at: "2026-01-01T00:00:00.000Z",
    foods: [],
    ...over,
  };
}

const sample: ShopWithFoods[] = [
  makeShop({
    name_ko: "명동분식",
    name_en: "Myeongdong Bunsik",
    hashtags: ["분식", "매콤"],
    view_count: 100,
    created_at: "2026-01-01T00:00:00.000Z",
    foods: [makeFood({ name_ko: "떡볶이", name_en: "Tteokbokki" })],
  }),
  makeShop({
    name_ko: "호떡왕",
    name_en: "Hotteok King",
    hashtags: ["달달"],
    view_count: 300,
    created_at: "2026-03-01T00:00:00.000Z",
    foods: [makeFood({ name_ko: "호떡", name_en: "Hotteok" })],
  }),
  makeShop({
    name_ko: "골목간식",
    name_en: "Alley Snacks",
    hashtags: ["고소함"],
    view_count: 200,
    created_at: "2026-02-01T00:00:00.000Z",
    foods: [makeFood({ name_ko: "계란빵", name_en: "Gyeranppang" })],
  }),
];

describe("sortShops", () => {
  it("sorts by view_count desc for 'popular'", () => {
    expect(sortShops(sample, "popular").map((s) => s.view_count)).toEqual([
      300, 200, 100,
    ]);
  });

  it("sorts by created_at desc for 'latest'", () => {
    expect(sortShops(sample, "latest").map((s) => s.name_ko)).toEqual([
      "호떡왕",
      "골목간식",
      "명동분식",
    ]);
  });

  it("does not mutate the input array", () => {
    const before = sample.map((s) => s.view_count);
    sortShops(sample, "popular");
    expect(sample.map((s) => s.view_count)).toEqual(before);
  });

  it("pins trending shops to the top regardless of views with trendingFirst", () => {
    const shops = [
      makeShop({ name_ko: "A", view_count: 900, is_trending: false }),
      makeShop({ name_ko: "B", view_count: 100, is_trending: true }),
      makeShop({ name_ko: "C", view_count: 500, is_trending: false }),
      makeShop({ name_ko: "D", view_count: 50, is_trending: true }),
    ];
    expect(
      sortShops(shops, "popular", { trendingFirst: true }).map((s) => s.name_ko),
    ).toEqual(["B", "D", "A", "C"]);
  });

  it("ignores trending when trendingFirst is not set (default)", () => {
    const shops = [
      makeShop({ name_ko: "plain-hi", view_count: 900, is_trending: false }),
      makeShop({ name_ko: "trend-lo", view_count: 100, is_trending: true }),
    ];
    expect(sortShops(shops, "popular").map((s) => s.name_ko)).toEqual([
      "plain-hi",
      "trend-lo",
    ]);
  });
});

describe("rankByViews", () => {
  it("assigns 1-based ranks ordered by views, carrying the shop", () => {
    const ranking = rankByViews(sample, 2);
    expect(ranking).toHaveLength(2);
    expect(ranking[0]).toMatchObject({ rank: 1 });
    expect(ranking[0].shop.name_ko).toBe("호떡왕");
    expect(ranking[1]).toMatchObject({ rank: 2 });
    expect(ranking[1].shop.name_ko).toBe("골목간식");
  });
});

describe("filterShops", () => {
  it("returns all when query is blank", () => {
    expect(filterShops(sample, "   ")).toHaveLength(3);
  });

  it("matches by shop korean name", () => {
    expect(filterShops(sample, "호떡왕").map((s) => s.name_ko)).toEqual([
      "호떡왕",
    ]);
  });

  it("matches by a menu food name (english, case-insensitive)", () => {
    expect(filterShops(sample, "BOKKI").map((s) => s.name_ko)).toEqual([
      "명동분식",
    ]);
  });

  it("matches by hashtag", () => {
    expect(filterShops(sample, "분식").map((s) => s.name_ko)).toEqual([
      "명동분식",
    ]);
  });
});
