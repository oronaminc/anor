#!/usr/bin/env node
/**
 * Sync your edited CSVs into the live DB (and upload local images to R2):
 *   data/shops.csv, data/foods.csv  ← the source you edit
 *   data/images/<file>              ← drop image files here
 *
 * Per row: if `image` is an http(s) URL or a /public path it's used as-is; if it
 * names a local file (e.g. lobster.png or data/images/lobster.png) the file is
 * uploaded to R2 and the resulting public URL is stored. Rows are UPSERTed by
 * `id` (a blank id = new row → a UUID is generated). Engagement counts are not
 * touched. After a run the CSVs are rewritten with the generated ids + uploaded
 * URLs, so re-running is idempotent (no re-upload).
 *
 *   npm run data:sync
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { randomUUID } from "node:crypto";

import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";
import { parseCsv, toCsv } from "./csv.mjs";
import { r2Configured, uploadToR2, contentTypeForExt } from "./r2.mjs";

loadEnvLocal();
const url = databaseUrl();
if (!url) {
  console.error("[sync] DATABASE_URL not set.");
  process.exit(1);
}
const sql = neon(url);

const sOrNull = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const numOrNull = (v) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : Number(s);
};
const truthy = (v) => /^(1|true|y|yes|on)$/i.test(String(v ?? "").trim());
function transOf(r) {
  const t = {};
  if (sOrNull(r.desc_en)) t.en = r.desc_en.trim();
  if (sOrNull(r.desc_ja)) t.ja = r.desc_ja.trim();
  if (sOrNull(r.desc_es)) t.es = r.desc_es.trim();
  return t;
}

const r2 = r2Configured();
if (!r2) {
  console.warn(
    "[sync] R2 not configured in .env.local — local image files won't upload; " +
      "image values are stored as-is. (URLs/public paths still work.)",
  );
}

async function resolveImage(val) {
  const v = String(val ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v) || v.startsWith("/")) return v; // URL or /public path
  const path = v.includes("/") ? v : `data/images/${v}`;
  if (!existsSync(path)) {
    console.warn(`  ⚠️  image not found: ${path} (kept "${v}")`);
    return v;
  }
  if (!r2) return v;
  const ext = extname(path).slice(1) || "jpg";
  const key = `uploads/${randomUUID()}.${ext}`;
  const publicUrl = await uploadToR2(readFileSync(path), key, contentTypeForExt(ext));
  console.log(`  ⬆️  ${basename(path)} → R2`);
  return publicUrl;
}

// ------------------------------------------------------------- districts
// The district registry is the location master: name -> fixed lat/lng. A shop
// with a district gets that area's coordinates automatically (below).
const districtCoords = {};
if (existsSync("data/districts.csv")) {
  const districts = parseCsv(readFileSync("data/districts.csv", "utf8"));
  for (const d of districts) {
    const name = sOrNull(d.name);
    if (!name) continue;
    const lat = numOrNull(d.lat);
    const lng = numOrNull(d.lng);
    await sql.query(
      `insert into public.districts (name, lat, lng) values ($1,$2,$3)
       on conflict (name) do update set lat=excluded.lat, lng=excluded.lng`,
      [name, lat, lng],
    );
    districtCoords[name] = { lat, lng };
  }
  console.log(`[sync] ${districts.length} districts`);
}

// ---------------------------------------------------------------- shops
const shops = parseCsv(readFileSync("data/shops.csv", "utf8"));
const shopCols = shops.length ? Object.keys(shops[0]) : [];
for (const r of shops) {
  const id = sOrNull(r.id) ?? randomUUID();
  const image = await resolveImage(r.image);
  r.id = id;
  r.image = image ?? "";
  const hashtags = String(r.hashtags ?? "")
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
  // A shop stores NO coordinates — its location is its `district` (zone), and
  // queries resolve lat/lng from the districts table by JOIN. So change a zone's
  // coords once (districts.csv) and every shop in it moves.
  await sql.query(
    `insert into public.shops
       (id, name_ko, name_en, name_ja, name_es, description, translations,
        lat, lng, address, youtube_shorts_url, thumbnail_url, hashtags,
        price_range, is_trending, growth_weight, district, line_pay)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     on conflict (id) do update set
       name_ko=excluded.name_ko, name_en=excluded.name_en, name_ja=excluded.name_ja,
       name_es=excluded.name_es, description=excluded.description,
       translations=excluded.translations, lat=excluded.lat, lng=excluded.lng,
       address=excluded.address, youtube_shorts_url=excluded.youtube_shorts_url,
       thumbnail_url=excluded.thumbnail_url, hashtags=excluded.hashtags,
       price_range=excluded.price_range, is_trending=excluded.is_trending,
       growth_weight=excluded.growth_weight, district=excluded.district,
       line_pay=excluded.line_pay`,
    [
      id, r.name_ko, sOrNull(r.name_en), sOrNull(r.name_ja), sOrNull(r.name_es),
      sOrNull(r.description), JSON.stringify(transOf(r)),
      null, null, sOrNull(r.address),
      sOrNull(r.youtube_shorts_url), image, hashtags,
      sOrNull(r.price_range), truthy(r.is_trending), numOrNull(r.growth_weight) ?? 1,
      sOrNull(r.district), truthy(r.line_pay),
    ],
  );
  console.log(`✓ shop: ${r.name_ko}`);
}

// ---------------------------------------------------------------- foods
const foods = parseCsv(readFileSync("data/foods.csv", "utf8"));
const foodCols = foods.length ? Object.keys(foods[0]) : [];
for (const r of foods) {
  if (!sOrNull(r.shop_id)) {
    console.warn(`  ⚠️  food "${r.name_ko}" has no shop_id — skipped`);
    continue;
  }
  const id = sOrNull(r.id) ?? randomUUID();
  const image = await resolveImage(r.image);
  r.id = id;
  r.image = image ?? "";
  await sql.query(
    `insert into public.shop_foods
       (id, shop_id, name_ko, name_en, name_ja, name_es, description,
        translations, image_url, price_range, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)
     on conflict (id) do update set
       shop_id=excluded.shop_id, name_ko=excluded.name_ko, name_en=excluded.name_en,
       name_ja=excluded.name_ja, name_es=excluded.name_es, description=excluded.description,
       translations=excluded.translations, image_url=excluded.image_url,
       price_range=excluded.price_range, sort_order=excluded.sort_order`,
    [
      id, r.shop_id, r.name_ko, sOrNull(r.name_en), sOrNull(r.name_ja),
      sOrNull(r.name_es), sOrNull(r.description), JSON.stringify(transOf(r)),
      image, sOrNull(r.price_range), numOrNull(r.sort_order) ?? 0,
    ],
  );
  console.log(`  ✓ food: ${r.name_ko}`);
}

// Persist generated ids + uploaded URLs back to the CSVs (idempotent re-runs).
if (shopCols.length) writeFileSync("data/shops.csv", toCsv(shops, shopCols));
if (foodCols.length) writeFileSync("data/foods.csv", toCsv(foods, foodCols));

console.log(
  `\n[sync] done: ${shops.length} shops, ${foods.length} foods → DB${r2 ? " + R2" : ""}.`,
);
