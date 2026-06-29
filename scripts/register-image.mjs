#!/usr/bin/env node
/**
 * Register a real photo for a menu food: upload it to R2 and set it as that
 * food's image (and the thumbnail of any shop whose first food is this one —
 * a shop's image is just its food image).
 *
 *   node scripts/register-image.mjs "계란빵" data/images/gyeranppang.jpg
 *   npm run data:image -- "계란빵" data/images/gyeranppang.jpg
 *
 * Accepts jpg/png/webp/gif/svg. Needs R2_* + DATABASE_URL in .env.local.
 */
import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";

import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";
import { r2Configured, uploadToR2, contentTypeForExt } from "./r2.mjs";

loadEnvLocal();

const [name, file] = process.argv.slice(2);
if (!name || !file) {
  console.error('usage: node scripts/register-image.mjs "<food_name_ko>" <image_file>');
  process.exit(1);
}
if (!existsSync(file)) {
  console.error("file not found:", file);
  process.exit(1);
}
if (!r2Configured()) {
  console.error("R2 not configured in .env.local (R2_* vars).");
  process.exit(1);
}
const url = databaseUrl();
if (!url) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}
const sql = neon(url);
const norm = (s) => String(s ?? "").replace(/\s/g, "");

const ext = extname(file).slice(1) || "jpg";
const r2url = await uploadToR2(
  readFileSync(file),
  `uploads/${randomUUID()}.${ext}`,
  contentTypeForExt(ext),
);
console.log("⬆️  uploaded →", r2url);

let foodCount = 0;
for (const f of await sql`SELECT id, name_ko FROM shop_foods`) {
  if (norm(f.name_ko) === norm(name)) {
    await sql`UPDATE shop_foods SET image_url = ${r2url} WHERE id = ${f.id}`;
    foodCount += 1;
  }
}

let shopCount = 0;
for (const s of await sql`SELECT id FROM shops`) {
  const first = await sql`
    SELECT name_ko FROM shop_foods WHERE shop_id = ${s.id} ORDER BY sort_order LIMIT 1
  `;
  if (first[0] && norm(first[0].name_ko) === norm(name)) {
    await sql`UPDATE shops SET thumbnail_url = ${r2url} WHERE id = ${s.id}`;
    shopCount += 1;
  }
}

console.log(`✅ "${name}" → ${foodCount} food(s), ${shopCount} shop thumbnail(s) updated.`);
