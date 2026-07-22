#!/usr/bin/env node
/**
 * Seed the retail pillar (Olive Young + Daiso) from a research JSON file:
 *   - generates a clean brand-toned SVG placeholder per product → public/products/
 *   - inserts products + retail_stores into the DB (re-runnable: it replaces only
 *     the seeded rows, i.e. products whose thumbnail is /products/*.svg)
 *   - regenerates lib/products-demo.ts so no-DB/demo mode mirrors the seed
 *
 * Real product photos are NOT rehosted (copyright) — the tiles are placeholders;
 * swap in a real photo per product later via the admin form (R2), same as food.
 *
 *   node scripts/seed-products.mjs [path/to/retail-data.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";

const SRC = process.argv[2] || "data/retail-data.json";
const data = JSON.parse(readFileSync(SRC, "utf8"));

const ACCENT = { olive_young: "#00A54F", daiso: "#E60012" };
const SOFT = { olive_young: "#eef7f0", daiso: "#fdeef0" };

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A light "packaging" placeholder tile: soft brand tint, accent top bar, big
 *  emoji, brand caption. Real photos replace these later. */
function tile(retailer, emoji, brand) {
  const accent = ACCENT[retailer];
  const soft = SOFT[retailer];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="${soft}"/>
  <rect width="800" height="12" fill="${accent}"/>
  <circle cx="400" cy="360" r="230" fill="#ffffff" opacity="0.55"/>
  <text x="400" y="380" font-size="300" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  <text x="400" y="660" font-size="46" font-weight="800" fill="${accent}" text-anchor="middle" font-family="sans-serif">${esc(brand)}</text>
</svg>
`;
}

const wonFmt = (n) =>
  "₩" + String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

mkdirSync("public/products", { recursive: true });

// Flatten products with a stable per-retailer index (used for the SVG filename).
const all = [];
for (const retailer of ["olive_young", "daiso"]) {
  const list = data[retailer]?.products ?? [];
  list.forEach((p, i) => {
    const brandCaption =
      retailer === "olive_young" ? p.brand || "OLIVE YOUNG" : "DAISO";
    const file = `${retailer === "olive_young" ? "oy" : "daiso"}-${i}.svg`;
    writeFileSync(`public/products/${file}`, tile(retailer, p.emoji || "🛍️", brandCaption));
    all.push({
      retailer,
      i,
      name_ko: p.name_ko,
      name_ja: p.name_ja ?? null,
      name_en: p.name_en ?? null,
      brand: p.brand ?? null,
      category: p.category ?? null,
      description: p.desc_ko ?? null,
      desc_ja: p.desc_ja ?? null,
      price_range: p.price_krw ? wonFmt(p.price_krw) : null,
      image: `/products/${file}`,
    });
  });
}

// ------------------------------------------------------------------ DB seed
loadEnvLocal();
const url = databaseUrl();
if (url) {
  const sql = neon(url);
  // Replace only previously-seeded rows (placeholder tiles); real admin products
  // (R2 thumbnails) and their counts are left untouched.
  await sql`DELETE FROM products WHERE thumbnail_url LIKE '/products/%'`;
  await sql`DELETE FROM retail_stores`;

  for (const p of all) {
    await sql`
      INSERT INTO products
        (retailer, name_ko, name_en, name_ja, brand, category, description,
         translations, price_range, thumbnail_url)
      VALUES
        (${p.retailer}, ${p.name_ko}, ${p.name_en}, ${p.name_ja}, ${p.brand},
         ${p.category}, ${p.description},
         ${JSON.stringify(p.desc_ja ? { ja: p.desc_ja } : {})}::jsonb,
         ${p.price_range}, ${p.image})
    `;
  }
  for (const s of data.stores ?? []) {
    await sql`
      INSERT INTO retail_stores (retailer, name_ko, name_ja, lat, lng, address)
      VALUES (${s.retailer}, ${s.name_ko}, ${s.name_ja ?? null}, ${s.lat ?? null},
              ${s.lng ?? null}, ${s.address ?? null})
    `;
  }
  console.log(
    `[seed-products] DB: ${all.length} products, ${(data.stores ?? []).length} stores.`,
  );
} else {
  console.log("[seed-products] no DATABASE_URL — skipped DB insert (SVGs + demo still written).");
}

// -------------------------------------------------- regenerate demo dataset
// Deterministic ids/short_ids/counts so no-DB demo mode shows a stable ranking.
let short = 0;
const demoProducts = [];
for (const retailer of ["olive_young", "daiso"]) {
  const list = all.filter((p) => p.retailer === retailer);
  list.forEach((p, idx) => {
    short += 1;
    const views = 9000 - idx * 173 - (retailer === "daiso" ? 500 : 0);
    demoProducts.push({
      id: `demo-${p.retailer === "olive_young" ? "oy" : "daiso"}-${p.i}`,
      retailer: p.retailer,
      name_ko: p.name_ko,
      name_en: p.name_en,
      name_ja: p.name_ja,
      brand: p.brand,
      category: p.category,
      description: p.description,
      translations: p.desc_ja ? { ja: p.desc_ja } : {},
      price_range: p.price_range,
      thumbnail_url: p.image,
      is_trending: idx < 2,
      view_count: Math.max(120, views),
      like_count: Math.max(20, Math.round(views / 8)),
      synthetic_view_count: 0,
      synthetic_like_count: 0,
      short_id: short,
      created_at: "2026-07-01T00:00:00.000Z",
    });
  });
}
const demoStores = (data.stores ?? []).map((s, i) => ({
  id: `demo-store-${i}`,
  retailer: s.retailer,
  name_ko: s.name_ko,
  name_ja: s.name_ja ?? null,
  lat: s.lat ?? null,
  lng: s.lng ?? null,
  address: s.address ?? null,
}));

const demoFile = `import type { Product, RetailStore } from "./types";

/**
 * Static demo dataset for the retail pillar (Olive Young + Daiso). GENERATED by
 * scripts/seed-products.mjs — do not edit by hand. Used as a fallback when no
 * database is configured (DATABASE_URL absent) or NEXT_PUBLIC_DEMO_MODE=1, so
 * the ranking pages render realistic content with zero config. Ordered by
 * retailer then view_count desc (getProducts relies on this order in demo mode).
 */

export const DEMO_PRODUCTS: Product[] = ${JSON.stringify(demoProducts, null, 2)};

export const DEMO_RETAIL_STORES: RetailStore[] = ${JSON.stringify(demoStores, null, 2)};
`;
writeFileSync("lib/products-demo.ts", demoFile);
console.log(
  `[seed-products] wrote ${all.length} SVGs → public/products/ + lib/products-demo.ts`,
);
