import { describe, it, expect } from "vitest";

import { normalizeQuery } from "@/lib/search";
import { filterFoods } from "@/lib/sort";
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
    like_count: 0,
    is_trending: false,
    price_range: null,
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
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

describe("filterFoods (search behavior)", () => {
  const foods = [
    makeFood({
      name_ko: "떡볶이",
      name_en: "Tteokbokki",
      name_ja: "トッポッキ",
      name_es: "Tteokbokki picante",
      category: "분식",
      hashtags: ["매콤", "명동맛집"],
    }),
    makeFood({
      name_ko: "호떡",
      name_en: "Hotteok",
      name_ja: "ホットク",
      category: "간식",
      hashtags: ["달달"],
    }),
  ];

  it("returns all results for a blank query", () => {
    expect(filterFoods(foods, "")).toHaveLength(2);
    expect(filterFoods(foods, "   ")).toHaveLength(2);
  });

  it("matches the Japanese name", () => {
    expect(filterFoods(foods, "トッポッキ").map((f) => f.name_ko)).toEqual([
      "떡볶이",
    ]);
  });

  it("matches the Spanish name (case-insensitive, partial)", () => {
    expect(filterFoods(foods, "PICANTE").map((f) => f.name_ko)).toEqual([
      "떡볶이",
    ]);
  });

  it("matches a hashtag", () => {
    expect(filterFoods(foods, "달달").map((f) => f.name_ko)).toEqual(["호떡"]);
  });

  it("matches a partial English token", () => {
    expect(filterFoods(foods, "bokki").map((f) => f.name_ko)).toEqual([
      "떡볶이",
    ]);
  });

  it("returns nothing for an unrelated query", () => {
    expect(filterFoods(foods, "초밥")).toHaveLength(0);
  });
});
