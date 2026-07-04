#!/usr/bin/env node
/**
 * Prune orphaned images from R2 — objects under `foods/` that no shop thumbnail
 * or menu-food photo references anymore (e.g. left behind by old admin uploads
 * before delete-on-update existed). Keeps exactly the images the DB still uses.
 *
 *   npm run r2:prune          # dry run — lists what WOULD be deleted
 *   npm run r2:prune -- --yes # actually delete the orphans
 *
 * Needs R2_* + DATABASE_URL in .env.local.
 */
import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";
import {
  r2Configured,
  listR2,
  deleteFromR2,
  keyFromPublicUrl,
} from "./r2.mjs";

loadEnvLocal();

if (!r2Configured()) {
  console.error("R2 not configured in .env.local (R2_* vars).");
  process.exit(1);
}
const dbUrl = databaseUrl();
if (!dbUrl) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}
const sql = neon(dbUrl);
const apply = process.argv.includes("--yes");

// Every R2 key the DB still points at (shop thumbnails + menu-food photos).
const referenced = new Set();
for (const r of await sql`
  SELECT thumbnail_url AS u FROM shops WHERE thumbnail_url IS NOT NULL
  UNION ALL
  SELECT image_url AS u FROM shop_foods WHERE image_url IS NOT NULL
`) {
  const key = keyFromPublicUrl(r.u);
  if (key) referenced.add(key);
}

// The whole bucket — images live under both uploads/ (older) and foods/ keys.
const keys = await listR2("");
const orphans = keys.filter((k) => !referenced.has(k));

console.log(
  `R2 bucket: ${keys.length} objects · ${referenced.size} referenced · ${orphans.length} orphaned`,
);
if (!orphans.length) {
  console.log("✅ nothing to prune.");
  process.exit(0);
}

let removed = 0;
for (const key of orphans) {
  if (!apply) {
    console.log("  would delete:", key);
    continue;
  }
  if (await deleteFromR2(key)) {
    console.log("  🗑️  deleted:", key);
    removed += 1;
  } else {
    console.log("  ⚠️  failed:", key);
  }
}

console.log(
  apply
    ? `✅ pruned ${removed}/${orphans.length} orphaned image(s).`
    : `\nDry run — re-run with \`-- --yes\` to delete these ${orphans.length} object(s).`,
);
