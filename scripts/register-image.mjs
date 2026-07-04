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

import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";
import {
  r2Configured,
  uploadToR2,
  contentTypeForExt,
  keyFromPublicUrl,
  deleteFromR2,
} from "./r2.mjs";

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

// Which menu foods match this name? Use any English name for a clean R2 key.
const matches = (
  await sql`SELECT id, name_ko, name_en, image_url FROM shop_foods`
).filter((f) => norm(f.name_ko) === norm(name));
const slugSrc = matches.find((f) => f.name_en)?.name_en || name;
const slug =
  slugSrc.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
  "food";

const ext = extname(file).slice(1).toLowerCase() || "jpg";
// Stable, human-readable key so the bucket is browsable in the R2 dashboard and
// re-registering the same food overwrites in place (URL stays valid, no orphans).
const key = `foods/${slug}.${ext}`;
const r2url = await uploadToR2(readFileSync(file), key, contentTypeForExt(ext));
console.log(`⬆️  uploaded → ${r2url}  (R2 key: ${key})`);

// Remember whatever these rows pointed at, so a superseded R2 image can be cleaned.
const oldUrls = new Set(matches.map((f) => f.image_url).filter(Boolean));

let foodCount = 0;
for (const f of matches) {
  await sql`UPDATE shop_foods SET image_url = ${r2url} WHERE id = ${f.id}`;
  foodCount += 1;
}

let shopCount = 0;
for (const s of await sql`SELECT id FROM shops`) {
  const first = await sql`
    SELECT name_ko FROM shop_foods WHERE shop_id = ${s.id} ORDER BY sort_order LIMIT 1
  `;
  if (first[0] && norm(first[0].name_ko) === norm(name)) {
    const cur = await sql`SELECT thumbnail_url FROM shops WHERE id = ${s.id}`;
    if (cur[0]?.thumbnail_url) oldUrls.add(cur[0].thumbnail_url);
    await sql`UPDATE shops SET thumbnail_url = ${r2url} WHERE id = ${s.id}`;
    shopCount += 1;
  }
}

// Delete each previous R2 image that nothing points at anymore (keep one image
// per food). Non-R2 URLs (external, /demo/*) and still-used images are left be.
let removed = 0;
for (const old of oldUrls) {
  if (old === r2url) continue;
  const key = keyFromPublicUrl(old);
  if (!key) continue;
  const used = await sql`
    SELECT 1 FROM shops WHERE thumbnail_url = ${old}
    UNION ALL SELECT 1 FROM shop_foods WHERE image_url = ${old} LIMIT 1
  `;
  if (used.length) continue;
  if (await deleteFromR2(key)) {
    console.log(`🗑️  removed old image: ${key}`);
    removed += 1;
  }
}

console.log(
  `✅ "${name}" → ${foodCount} food(s), ${shopCount} shop thumbnail(s) updated` +
    (removed ? `, ${removed} old image(s) removed.` : "."),
);
