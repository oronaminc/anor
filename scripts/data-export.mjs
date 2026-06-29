#!/usr/bin/env node
/**
 * Export the live DB content to human-editable CSVs (your management surface):
 *   data/shops.csv   — one row per shop
 *   data/foods.csv   — one row per menu food (shop_id links to a shop)
 *   data/images/     — drop local image files here to upload on sync
 *
 * The CSVs hold CONTENT only (names, descriptions, location, trending, image).
 * Engagement counts (views/likes/synthetic) stay in the DB and are NOT exported,
 * so re-syncing never resets them. Edit the CSVs, then `npm run data:sync`.
 *
 * `data/` is gitignored — it is never pushed.
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";
import { toCsv } from "./csv.mjs";

loadEnvLocal();
const url = databaseUrl();
if (!url) {
  console.error("[export] DATABASE_URL not set — nothing to export.");
  process.exit(1);
}
const sql = neon(url);

const SHOP_COLS = [
  "id", "name_ko", "name_en", "name_ja", "name_es",
  "description", "desc_en", "desc_ja", "desc_es",
  "lat", "lng", "address", "youtube_shorts_url",
  "hashtags", "price_range", "is_trending", "growth_weight", "image",
];
const FOOD_COLS = [
  "id", "shop_id", "name_ko", "name_en", "name_ja", "name_es",
  "description", "desc_en", "desc_ja", "desc_es",
  "price_range", "sort_order", "image",
];

const tr = (v) => (typeof v === "string" ? JSON.parse(v || "{}") : v || {});

mkdirSync("data/images", { recursive: true });

const shops = await sql`SELECT * FROM shops ORDER BY created_at`;
const shopRows = shops.map((s) => {
  const t = tr(s.translations);
  return {
    ...s,
    desc_en: t.en ?? "",
    desc_ja: t.ja ?? "",
    desc_es: t.es ?? "",
    hashtags: (s.hashtags ?? []).join("|"),
    is_trending: s.is_trending ? "true" : "false",
    image: s.thumbnail_url ?? "",
  };
});
writeFileSync("data/shops.csv", toCsv(shopRows, SHOP_COLS));

const foods = await sql`SELECT * FROM shop_foods ORDER BY shop_id, sort_order`;
const foodRows = foods.map((f) => {
  const t = tr(f.translations);
  return {
    ...f,
    desc_en: t.en ?? "",
    desc_ja: t.ja ?? "",
    desc_es: t.es ?? "",
    image: f.image_url ?? "",
  };
});
writeFileSync("data/foods.csv", toCsv(foodRows, FOOD_COLS));

console.log(
  `[export] wrote data/shops.csv (${shopRows.length} shops) + ` +
    `data/foods.csv (${foodRows.length} foods). Edit them, then: npm run data:sync`,
);
