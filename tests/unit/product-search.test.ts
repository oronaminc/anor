import { describe, it, expect } from "vitest";

import { filterProducts } from "@/lib/product-search";
import type { Product } from "@/lib/types";

function makeProduct(over: Partial<Product>): Product {
  return {
    id: crypto.randomUUID(),
    retailer: "olive_young",
    name_ko: "상품",
    name_en: null,
    name_ja: null,
    brand: null,
    category: null,
    description: null,
    translations: null,
    price_range: null,
    thumbnail_url: null,
    is_trending: false,
    view_count: 0,
    like_count: 0,
    synthetic_view_count: 0,
    synthetic_like_count: 0,
    short_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

const toner = makeProduct({
  name_ko: "라운드랩 1025 독도 토너",
  name_ja: "ラウンドラボ 1025 独島トナー",
  name_en: "Round Lab 1025 Dokdo Toner",
  brand: "라운드랩",
  category: "skincare",
});
const mask = makeProduct({
  name_ko: "메디힐 티트리 마스크",
  name_ja: "メディヒール ティーツリーマスク",
  brand: "메디힐",
  category: "mask",
});
const daisoTumbler = makeProduct({
  retailer: "daiso",
  name_ko: "보온 텀블러",
  name_ja: "保温タンブラー",
  category: "kitchen",
});

const ALL = [toner, mask, daisoTumbler];

describe("filterProducts", () => {
  it("returns everything for a blank query", () => {
    expect(filterProducts(ALL, "")).toHaveLength(3);
    expect(filterProducts(ALL, "   ")).toHaveLength(3);
  });

  it("matches the Korean name", () => {
    expect(filterProducts(ALL, "독도")).toEqual([toner]);
  });

  it("matches the Japanese name — so a JP user finds the same row", () => {
    expect(filterProducts(ALL, "タンブラー")).toEqual([daisoTumbler]);
  });

  it("matches the English name case-insensitively", () => {
    expect(filterProducts(ALL, "round lab")).toEqual([toner]);
  });

  it("matches the brand", () => {
    expect(filterProducts(ALL, "메디힐")).toEqual([mask]);
  });

  it("matches the category label in BOTH languages", () => {
    // "마스크팩" / "マスクパック" is the ko/ja label of the `mask` category —
    // neither string appears in the product's own fields.
    expect(filterProducts(ALL, "마스크팩")).toEqual([mask]);
    expect(filterProducts(ALL, "マスクパック")).toEqual([mask]);
  });

  it("returns nothing for a query that matches no field", () => {
    expect(filterProducts(ALL, "zzzznotaproduct")).toEqual([]);
  });

  it("ignores an unknown retailer's category lookup instead of throwing", () => {
    const odd = makeProduct({ retailer: "nowhere", name_ko: "미지의 상품" });
    expect(filterProducts([odd], "미지")).toEqual([odd]);
  });
});
