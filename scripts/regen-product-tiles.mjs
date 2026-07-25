#!/usr/bin/env node
/**
 * Regenerate ONLY the product placeholder tiles (public/products/*.svg) with a
 * cleaner "product card" look. Does NOT touch the DB — the filenames are stable
 * (oy-<i>.svg / daiso-<i>.svg) and rows already point at them, so trending flags
 * and counts are preserved. Real photos still replace these per-product via the
 * admin form (R2). Run: node scripts/regen-product-tiles.mjs [retail-data.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SRC = process.argv[2] || "data/retail-data.json";
const data = JSON.parse(readFileSync(SRC, "utf8"));

const BRAND = {
  olive_young: { a: "#00A54F", a2: "#37c98a", tint: "#eefaf2", caption: "OLIVE YOUNG" },
  daiso: { a: "#E60012", a2: "#ff5a6a", tint: "#fff0f1", caption: "DAISO" },
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Premium-ish placeholder: soft brand gradient, glow, a glossy white package
 *  holding the product emoji, brand caption. Language-neutral (the localized
 *  name is rendered in the page, not baked into the tile). */
function tile(retailer, emoji, brandText) {
  const b = BRAND[retailer];
  const caption = esc(brandText || b.caption).slice(0, 22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${b.tint}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.5">
      <stop offset="0" stop-color="${b.a2}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${b.a2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pkg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f2f3f4"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#0b1f14" flood-opacity="0.14"/>
    </filter>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect width="800" height="800" fill="url(#glow)"/>
  <circle cx="400" cy="352" r="196" fill="url(#pkg)" filter="url(#sh)"/>
  <path d="M232 300a168 168 0 0 1 336 0z" fill="#ffffff" opacity="0.5"/>
  <text x="400" y="372" font-size="196" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  <rect x="300" y="612" width="200" height="6" rx="3" fill="${b.a}"/>
  <text x="400" y="676" font-size="40" font-weight="800" letter-spacing="1" fill="${b.a}" text-anchor="middle" font-family="'Helvetica Neue',Arial,sans-serif">${caption}</text>
</svg>
`;
}

mkdirSync("public/products", { recursive: true });
let n = 0;
for (const retailer of ["olive_young", "daiso"]) {
  const list = data[retailer]?.products ?? [];
  list.forEach((p, i) => {
    const file = `${retailer === "olive_young" ? "oy" : "daiso"}-${i}.svg`;
    const brandText = retailer === "olive_young" ? p.brand || "OLIVE YOUNG" : "DAISO";
    writeFileSync(`public/products/${file}`, tile(retailer, p.emoji || "🛍️", brandText));
    n += 1;
  });
}
console.log(`[regen-product-tiles] rewrote ${n} SVGs → public/products/ (DB untouched)`);
