import { describe, it, expect } from "vitest";

import { normalizeQuery } from "@/lib/search";
import { filterShops } from "@/lib/sort";
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
    hashtags_ja: null,
    price_range: null,
    district: null,
    line_pay: false,
    certified: false,
    categories: [],
    short_id: null,
    view_count: 0,
    like_count: 0,
    synthetic_view_count: 0,
    synthetic_like_count: 0,
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

describe("normalizeQuery", () => {
  it("trims, lowercases and collapses whitespace", () => {
    expect(normalizeQuery("  Tteok   Bokki ")).toBe("tteok bokki");
    expect(normalizeQuery("HOTTEOK")).toBe("hotteok");
    expect(normalizeQuery("\t호떡\n")).toBe("호떡");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeQuery("   ")).toBe("");
    expect(normalizeQuery("")).toBe("");
  });
});

describe("filterShops (search behavior — matches shop + menu-food names)", () => {
  const shops = [
    makeShop({
      name_ko: "분식가게",
      hashtags: ["매콤", "명동맛집"],
      foods: [
        makeFood({
          name_ko: "떡볶이",
          name_en: "Tteokbokki",
          name_ja: "トッポッキ",
          name_es: "Tteokbokki picante",
        }),
      ],
    }),
    makeShop({
      name_ko: "간식가게",
      hashtags: ["달달"],
      foods: [makeFood({ name_ko: "호떡", name_en: "Hotteok", name_ja: "ホットク" })],
    }),
  ];

  it("returns all results for a blank query", () => {
    expect(filterShops(shops, "")).toHaveLength(2);
    expect(filterShops(shops, "   ")).toHaveLength(2);
  });

  it("matches a menu food's Japanese name", () => {
    expect(filterShops(shops, "トッポッキ").map((s) => s.name_ko)).toEqual([
      "분식가게",
    ]);
  });

  it("matches a menu food's Spanish name (case-insensitive, partial)", () => {
    expect(filterShops(shops, "PICANTE").map((s) => s.name_ko)).toEqual([
      "분식가게",
    ]);
  });

  it("matches a hashtag", () => {
    expect(filterShops(shops, "달달").map((s) => s.name_ko)).toEqual([
      "간식가게",
    ]);
  });

  it("matches a partial English food token", () => {
    expect(filterShops(shops, "bokki").map((s) => s.name_ko)).toEqual([
      "분식가게",
    ]);
  });

  it("returns nothing for an unrelated query", () => {
    expect(filterShops(shops, "초밥")).toHaveLength(0);
  });
});
