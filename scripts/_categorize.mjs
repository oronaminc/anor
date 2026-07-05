#!/usr/bin/env node
// Assign broad category codes (lib/categories.ts) to every shop from its foods.
// Updates the DB and data/shops.csv. Keyword-based, multi-category allowed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parseCsv, toCsv } from "./csv.mjs";
import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";

loadEnvLocal();

// Fine categories (≈20, each holds ≤10 shops). One primary category per shop,
// picked from its food's Korean name — order matters (first match wins).
export function categoriesFor(text) {
  const n = String(text || "");
  const has = (...ks) => ks.some((k) => n.includes(k));
  let code;
  if (has("양꼬치")) code = "yangkochi";
  else if (has("닭꼬치", "닭 꼬치", "닭이 꼬치")) code = "dakkochi";
  else if (has("해물꼬치", "꼬치")) code = "kochi";
  else if (has("떡볶이", "분식", "토스트", "김말")) code = "tteok";
  else if (has("만두", "교자", "김밥")) code = "mandu";
  else if (has("잡채", "볶음밥", "야끼소바", "팟타이", "어묵", "타코야끼")) code = "japchae";
  else if (has("호떡", "붕어빵", "잉어빵", "계란빵", "십원빵")) code = "hotteok";
  else if (has("크로와상", "마늘빵", "크록스빵")) code = "bakery";
  else if (has("모찌", "강정", "달고나")) code = "mochi";
  else if (has("와플", "크레페", "크로플", "누텔라", "펜케이크", "팬케이크", "추러스")) code = "waffle";
  else if (has("아이스", "마시멜로", "하겐다즈")) code = "icecream";
  else if (has("핫도그", "핫바")) code = "hotdog";
  else if (has("스테이크", "삼겹", "바베큐", "치즈구이")) code = "steak";
  else if (has("치킨", "닭발", "불닭", "오믈렛", "케밥")) code = "chicken";
  else if (has("랍스", "크랩", "새우")) code = "lobster";
  else if (has("전복", "가리비", "관자", "오징어", "문어", "쭈꾸미")) code = "shellfish";
  else if (has("주스", "에이드", "석류", "컵과일")) code = "drink";
  else if (has("탕후", "과일")) code = "fruit";
  else if (has("군밤", "군고구마", "고구마", "옥수수", "은행", "밤", "맛탕")) code = "roasted";
  else if (has("감자", "튀김", "프라이", "프렌치")) code = "fried";
  else code = "tteok";
  return [code];
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
    const src = (foodsByShop.get(s.id) || [s.name_ko]).join(" ");
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
    for (const s of shops) csvCats.set(s.id, categoriesFor((foodsByShop.get(s.id) || [s.name_ko]).join(" ")).join("|"));
    for (const r of rows) if (csvCats.has(r.id)) r.categories = csvCats.get(r.id);
    if (!cols.includes("categories")) cols.push("categories");
    writeFileSync("data/shops.csv", toCsv(rows, cols));
    console.log("data/shops.csv categories 반영");
  }
}
