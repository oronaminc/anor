#!/usr/bin/env node
/**
 * Sync retail_stores from data/retail-data.json's `stores` array into the DB and
 * regenerate ONLY the DEMO_RETAIL_STORES export in lib/products-demo.ts. Does not
 * touch products or counts. Idempotent (replaces the store set wholesale).
 *   node scripts/sync-stores.mjs [retail-data.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";

const SRC = process.argv[2] || "data/retail-data.json";
const stores = JSON.parse(readFileSync(SRC, "utf8")).stores ?? [];

loadEnvLocal();
const url = databaseUrl();
if (url) {
  const sql = neon(url);
  await sql`DELETE FROM retail_stores`;
  for (const s of stores) {
    await sql`
      INSERT INTO retail_stores (retailer, name_ko, name_ja, lat, lng, address)
      VALUES (${s.retailer}, ${s.name_ko}, ${s.name_ja ?? null}, ${s.lat ?? null},
              ${s.lng ?? null}, ${s.address ?? null})
    `;
  }
  console.log(`[sync-stores] DB: ${stores.length} stores`);
} else {
  console.log("[sync-stores] no DATABASE_URL — DB insert skipped");
}

// Regenerate the DEMO_RETAIL_STORES export (last export in products-demo.ts).
const demoStores = stores.map((s, i) => ({
  id: `demo-store-${i}`,
  retailer: s.retailer,
  name_ko: s.name_ko,
  name_ja: s.name_ja ?? null,
  lat: s.lat ?? null,
  lng: s.lng ?? null,
  address: s.address ?? null,
}));
const file = "lib/products-demo.ts";
let src = readFileSync(file, "utf8");
src = src.replace(
  /export const DEMO_RETAIL_STORES: RetailStore\[\] = [\s\S]*$/,
  `export const DEMO_RETAIL_STORES: RetailStore[] = ${JSON.stringify(demoStores, null, 2)};\n`,
);
writeFileSync(file, src);
console.log(`[sync-stores] regenerated DEMO_RETAIL_STORES (${demoStores.length})`);
