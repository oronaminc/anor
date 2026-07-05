#!/usr/bin/env node
// Assign broad category codes (lib/categories.ts) to every shop from its foods.
// Updates the DB and data/shops.csv. Keyword-based, multi-category allowed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parseCsv, toCsv } from "./csv.mjs";
import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";

loadEnvLocal();

export function categoriesFor(text) {
  const n = String(text || "");
  const c = new Set();
  const has = (...ks) => ks.some((k) => n.includes(k));
  if (has("꼬치")) c.add("skewer");
  if (has("핫도그", "핫바")) c.add("hotdog");
  if (has("호떡", "계란빵", "붕어빵", "십원빵", "크로와상", "크록스빵", "잉어빵", "마늘빵", "빵"))
    c.add("bread");
  if (has("모찌", "탕후", "와플", "크레페", "크레테", "크로플", "달고나", "강정", "추러스", "펜케이크", "팬케이크", "수플레", "누텔라"))
    c.add("sweet");
  if (has("아이스", "하겐다즈")) c.add("ice");
  if (has("주스", "에이드", "석류")) c.add("drink");
  if (has("떡볶이", "김밥", "잡채", "만두", "분식", "토스트", "교자", "볶음밥", "야끼소바", "팟타이", "어묵", "타코야끼", "김말"))
    c.add("bunsik");
  if (has("랍스", "새우", "세우", "전복", "오징어", "문어", "가리비", "관자", "크랩", "해물", "쭈꾸미", "게튀김"))
    c.add("seafood");
  if (has("스테이크", "삼겹", "치킨", "바베큐", "불닭", "닭발", "오믈렛", "겹살", "소불고기", "치즈구이", "케밥"))
    c.add("meat");
  if (has("튀김", "프라이", "프렌치", "감자")) c.add("fried");
  if (has("과일")) c.add("fruit");
  if (has("군밤", "군고구마", "고구마", "옥수수", "은행", "맛탕")) c.add("roasted");
  // 꼬치 dishes are skewers first — drop the noisier "meat" tag they also match.
  if (c.has("skewer") && c.has("meat") && n.includes("꼬치")) c.delete("meat");
  if (c.size === 0) c.add("bunsik");
  return [...c];
}

// Run only when invoked directly (allows importing categoriesFor for tests).
if (process.argv[1] && process.argv[1].endsWith("_categorize.mjs")) {
  const sql = neon(databaseUrl());
  const foodsByShop = new Map();
  for (const f of await sql`SELECT shop_id, name_ko FROM shop_foods`) {
    const arr = foodsByShop.get(f.shop_id) || [];
    arr.push(f.name_ko);
    foodsByShop.set(f.shop_id, arr);
  }
  const shops = await sql`SELECT id, name_ko FROM shops`;
  const dist = {};
  for (const s of shops) {
    const src = [s.name_ko, ...(foodsByShop.get(s.id) || [])].join(" ");
    const cats = categoriesFor(src);
    await sql`UPDATE shops SET categories = ${cats} WHERE id = ${s.id}`;
    for (const c of cats) dist[c] = (dist[c] || 0) + 1;
  }
  console.log(`✅ ${shops.length} shops categorized.`);
  console.log("분포:", Object.entries(dist).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join("  "));

  // Mirror into data/shops.csv (categories column, "|"-joined).
  if (existsSync("data/shops.csv")) {
    const rows = parseCsv(readFileSync("data/shops.csv", "utf8"));
    const cols = Object.keys(rows[0]);
    const csvCats = new Map();
    for (const s of shops) csvCats.set(s.id, categoriesFor([s.name_ko, ...(foodsByShop.get(s.id) || [])].join(" ")).join("|"));
    for (const r of rows) if (csvCats.has(r.id)) r.categories = csvCats.get(r.id);
    if (!cols.includes("categories")) cols.push("categories");
    writeFileSync("data/shops.csv", toCsv(rows, cols));
    console.log("data/shops.csv categories 반영");
  }
}
