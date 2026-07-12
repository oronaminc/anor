#!/usr/bin/env node
// One-off: turn the 146 marked Myeongdong stall points + generated content into
// SVG images (Japanese labels) + appended shops.csv / foods.csv rows.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { parseCsv, toCsv } from "./csv.mjs";

const points = JSON.parse(readFileSync("data/_points.json", "utf8")); // {id,note,lat,lng}
const foods = JSON.parse(readFileSync("data/_foods_unique.json", "utf8")); // note[] (index order)
const content = JSON.parse(readFileSync("data/_content.json", "utf8")); // [{id:index, ...}]
const byIndex = new Map(content.map((c) => [c.id, c]));
const idxOfNote = new Map(foods.map((n, i) => [n, i]));

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svgFor(emoji, label) {
  const len = [...String(label)].length;
  const fs = len > 15 ? 32 : len > 11 ? 40 : len > 7 ? 48 : 56;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c2c32"/><stop offset="1" stop-color="#121215"/></linearGradient></defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <text x="400" y="290" font-size="210" text-anchor="middle" dominant-baseline="central">${emoji}<animateTransform attributeName="transform" type="rotate" additive="sum" values="-11 400 290;11 400 290;-11 400 290" dur="1.7s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;0 -38;0 0;0 20;0 0" keyTimes="0;0.28;0.5;0.74;1" dur="1.7s" repeatCount="indefinite"/></text>
  <text x="400" y="500" font-size="${fs}" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${esc(label)}</text>
</svg>
`;
}

// 1) SVG per unique food (Japanese label + emoji), served from /public/food.
mkdirSync("public/food", { recursive: true });
const imgOf = new Map();
for (let i = 0; i < foods.length; i++) {
  const c = byIndex.get(i);
  const emoji = (c && c.emoji) || "🍢";
  const label = (c && c.food_name_ja) || foods[i];
  writeFileSync(`public/food/f${i}.svg`, svgFor(emoji, label));
  imgOf.set(i, `/food/f${i}.svg`);
}

// 2) Append 146 shops + foods to the exported CSVs (matching their columns).
const shopRows = parseCsv(readFileSync("data/shops.csv", "utf8"));
const foodRows = parseCsv(readFileSync("data/foods.csv", "utf8"));
const shopCols = Object.keys(shopRows[0]);
const foodCols = Object.keys(foodRows[0]);

let missing = 0;
const nameCount = new Map();
for (const p of points) {
  const i = idxOfNote.get(p.note);
  const c = byIndex.get(i);
  if (!c) missing++;
  let sn = (c && c.shop_name_ko) || `명동 ${p.note}`;
  const seen = (nameCount.get(sn) || 0) + 1;
  nameCount.set(sn, seen);
  if (seen > 1) sn = `${sn} ${seen}`;
  const img = imgOf.get(i) || "";
  const hashtags = ((c && c.hashtags) || []).join("|");
  const price = (c && c.price_range) || "";
  const descKo = (c && c.desc_ko) || "";
  const descJa = (c && c.desc_ja) || "";
  const shopId = randomUUID();
  const foodId = randomUUID();
  shopRows.push({
    id: shopId, name_ko: sn, name_en: "", name_ja: (c && c.shop_name_ja) || sn, name_es: "",
    description: descKo, desc_en: "", desc_ja: descJa, desc_es: "",
    lat: p.lat, lng: p.lng, address: "", youtube_shorts_url: "",
    hashtags, price_range: price, district: "명동 노점거리",
    pay_pay: "true", certified: "false", is_trending: "false", growth_weight: "1", image: img,
  });
  foodRows.push({
    id: foodId, shop_id: shopId, name_ko: p.note, name_en: "", name_ja: (c && c.food_name_ja) || p.note, name_es: "",
    description: descKo, desc_en: "", desc_ja: descJa, desc_es: "",
    price_range: price, sort_order: "0", image: img,
  });
}

writeFileSync("data/shops.csv", toCsv(shopRows, shopCols));
writeFileSync("data/foods.csv", toCsv(foodRows, foodCols));
console.log(
  `✅ shops.csv: ${shopRows.length} rows · foods.csv: ${foodRows.length} rows · ` +
    `${foods.length} SVGs → public/food/` + (missing ? ` · ⚠️ ${missing} stalls had no content` : ""),
);
