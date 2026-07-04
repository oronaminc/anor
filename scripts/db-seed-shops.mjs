#!/usr/bin/env node
/**
 * Seed the shop/menu sample data (가게 + 음식들). A shop is the engagement unit
 * (views/likes/trending/weekly) with one map point + one youtube link and many
 * menu foods. Food photos use the /demo/*.svg placeholders — replace with real
 * photos later.
 *
 *   npm run db:seed:shops          # insert (idempotent — skips if present)
 *   npm run db:seed:shops:clear     # remove ONLY these demo shops
 *
 * Demo shops are marked by thumbnail_url like /demo/%, so real shops are never
 * touched. No-ops without DATABASE_URL.
 */
import { loadEnvLocal, databaseUrl, neon } from "./lib.mjs";

loadEnvLocal();
const url = databaseUrl();
if (!url) {
  console.log("[seed-shops] DATABASE_URL not set — skipping.");
  process.exit(0);
}
const sql = neon(url);

// Menu-food catalog (reused across shops); photos are /demo placeholders.
const F = {
  tteokbokki: {
    name_ko: "떡볶이", name_en: "Tteokbokki", name_ja: "トッポッキ", name_es: "Tteokbokki",
    description: "쫄깃한 가래떡과 매콤달콤한 고추장 양념.",
    translations: { en: "Chewy rice cakes in sweet-spicy gochujang sauce.", ja: "もちもち餅と甘辛コチュジャン。", es: "Pasteles de arroz en salsa gochujang agridulce." },
    image_url: "/demo/tteokbokki.svg", price_range: "₩3,000~5,000",
  },
  hotteok: {
    name_ko: "호떡", name_en: "Hotteok", name_ja: "ホットク", name_es: "Hotteok",
    description: "바삭한 겉면 속 흑설탕과 견과류.",
    translations: { en: "Crispy pancake with molten brown sugar and nuts.", ja: "黒砂糖とナッツのカリカリホットク。", es: "Panqueque crujiente de azúcar moreno y nueces." },
    image_url: "/demo/hotteok.svg", price_range: "₩2,000~3,000",
  },
  gyeranppang: {
    name_ko: "계란빵", name_en: "Gyeranppang", name_ja: "ケランパン（たまごパン）", name_es: "Gyeranppang",
    description: "폭신한 빵 위에 통계란.",
    translations: { en: "Fluffy bread baked with a whole egg.", ja: "ふわふわパンに丸ごと卵。", es: "Pan esponjoso con un huevo entero." },
    image_url: "/demo/gyeranppang.svg", price_range: "₩2,000~3,000",
  },
  mandu: {
    name_ko: "왕만두", name_en: "Wang Mandu", name_ja: "王マンドゥ", name_es: "Wang Mandu",
    description: "김이 모락모락 손만두.",
    translations: { en: "Steaming hand-made dumplings.", ja: "湯気立つ手作り餃子。", es: "Empanadillas artesanales humeantes." },
    image_url: "/demo/mandu.svg", price_range: "₩4,000~6,000",
  },
  potato: {
    name_ko: "회오리감자", name_en: "Tornado Potato", name_ja: "トルネードポテト", name_es: "Patata Tornado",
    description: "회오리로 깎아 튀긴 바삭 감자.",
    translations: { en: "Spiral-cut deep-fried crispy potato.", ja: "竜巻状に揚げたサクサクポテト。", es: "Patata en espiral frita y crujiente." },
    image_url: "/demo/potato.svg", price_range: "₩4,000~5,000",
  },
  dakkkochi: {
    name_ko: "닭꼬치", name_en: "Dak-kkochi", name_ja: "タッコチ（鶏串）", name_es: "Brocheta de Pollo",
    description: "숯불에 구운 매콤달콤 닭꼬치.",
    translations: { en: "Charcoal-grilled sweet-spicy chicken skewer.", ja: "炭火の甘辛チキン串。", es: "Brocheta de pollo a la brasa agridulce." },
    image_url: "/demo/dakkkochi.svg", price_range: "₩3,000~4,000",
  },
  lobster: {
    name_ko: "치즈 랍스터", name_en: "Cheese Lobster", name_ja: "チーズロブスター", name_es: "Langosta con Queso",
    description: "모짜렐라 듬뿍 토치 랍스터.",
    translations: { en: "Half a lobster torched with mozzarella.", ja: "モッツァレラを炙ったロブスター。", es: "Langosta gratinada con mozzarella." },
    image_url: "/demo/lobster.svg", price_range: "₩15,000~20,000",
  },
  bungeoppang: {
    name_ko: "붕어빵", name_en: "Bungeoppang", name_ja: "プンオパン（たい焼き）", name_es: "Bungeoppang",
    description: "팥 가득 따끈한 붕어빵.",
    translations: { en: "Warm fish-shaped pastry with red bean.", ja: "あんこたっぷりのたい焼き。", es: "Bollo de pez relleno de judía dulce." },
    image_url: "/demo/bungeoppang.svg", price_range: "₩2,000~3,000",
  },
};

// 6 Myeongdong shops, each selling a few menu foods.
const SHOPS = [
  {
    name_ko: "명동분식", name_en: "Myeongdong Bunsik", name_ja: "明洞ブンシク", name_es: "Myeongdong Bunsik",
    description: "명동 한복판의 대표 분식집. 떡볶이와 만두가 일품.",
    translations: { en: "A beloved snack shop in the heart of Myeongdong.", ja: "明洞中心の人気粉食店。", es: "Una querida casa de snacks en el corazón de Myeongdong." },
    lat: 37.5636, lng: 126.9857, address: "서울 중구 명동길 14",
    youtube_shorts_url: "https://www.youtube.com/shorts/ZpM0pZ8wMqA",
    hashtags: ["분식", "명동맛집", "매콤"], price_range: "₩3,000~6,000",
    view_count: 8420, like_count: 1240, is_trending: true, growth_weight: 1.3,
    foods: ["tteokbokki", "mandu", "gyeranppang"],
  },
  {
    name_ko: "호떡왕", name_en: "Hotteok King", name_ja: "ホットク王", name_es: "Rey del Hotteok",
    description: "겨울이면 줄 서는 호떡 노점.",
    translations: { en: "The hotteok stall with a winter queue.", ja: "冬は行列のホットク屋台。", es: "El puesto de hotteok con cola en invierno." },
    lat: 37.5639, lng: 126.9829, address: "서울 중구 명동8길 21",
    youtube_shorts_url: "https://www.youtube.com/shorts/3sJf9bq5mWk",
    hashtags: ["겨울간식", "호떡", "달달"], price_range: "₩2,000~3,000",
    view_count: 6310, like_count: 980, is_trending: true, growth_weight: 1.15,
    foods: ["hotteok", "bungeoppang"],
  },
  {
    name_ko: "명동씨푸드", name_en: "Myeongdong Seafood", name_ja: "明洞シーフード", name_es: "Mariscos Myeongdong",
    description: "비주얼 끝판왕 치즈 랍스터로 유명.",
    translations: { en: "Famous for the show-stopping cheese lobster.", ja: "映えるチーズロブスターで有名。", es: "Famoso por su espectacular langosta con queso." },
    lat: 37.5642, lng: 126.9848, address: "서울 중구 명동길 12",
    youtube_shorts_url: "https://www.youtube.com/shorts/Lr7cH2zX5pQ",
    hashtags: ["해산물", "명동명물", "비주얼"], price_range: "₩15,000~20,000",
    view_count: 9870, like_count: 1530, is_trending: true, growth_weight: 1.4,
    foods: ["lobster"],
  },
  {
    name_ko: "종로꼬치", name_en: "Jongno Skewers", name_ja: "鍾路串焼き", name_es: "Brochetas Jongno",
    description: "숯불 향 가득한 꼬치 전문 노점.",
    translations: { en: "A skewer stall full of charcoal aroma.", ja: "炭火の香り漂う串屋台。", es: "Un puesto de brochetas con aroma a brasa." },
    lat: 37.5609, lng: 126.9863, address: "서울 중구 명동길 31",
    youtube_shorts_url: "https://www.youtube.com/shorts/Bn4kL0qR9sM",
    hashtags: ["꼬치", "숯불", "야식"], price_range: "₩3,000~5,000",
    view_count: 2150, like_count: 240, is_trending: false, growth_weight: 0.85,
    foods: ["dakkkochi", "potato"],
  },
  {
    name_ko: "회오리야", name_en: "Tornado-ya", name_ja: "トルネード屋", name_es: "Tornado-ya",
    description: "회오리 감자로 인스타를 점령한 곳.",
    translations: { en: "The tornado potato spot all over Instagram.", ja: "竜巻ポテトでインスタを席巻。", es: "El sitio de patata tornado de Instagram." },
    lat: 37.5631, lng: 126.9835, address: "서울 중구 명동길 18",
    youtube_shorts_url: "https://www.youtube.com/shorts/Tq8wZ1nP4xY",
    hashtags: ["회오리감자", "인스타", "바삭"], price_range: "₩4,000~5,000",
    view_count: 4760, like_count: 612, is_trending: true, growth_weight: 1.1,
    foods: ["potato", "dakkkochi"],
  },
  {
    name_ko: "골목간식", name_en: "Alley Snacks", name_ja: "路地スナック", name_es: "Snacks del Callejón",
    description: "가성비 좋은 골목 간식 노점.",
    translations: { en: "A great-value snack stall down the alley.", ja: "コスパ抜群の路地スナック。", es: "Un puesto de snacks económico en el callejón." },
    lat: 37.5620, lng: 126.9830, address: "서울 중구 명동7길 8",
    youtube_shorts_url: "https://www.youtube.com/shorts/Pf3nQ8wK1aB",
    hashtags: ["간식", "골목", "가성비"], price_range: "₩2,000~3,000",
    view_count: 1320, like_count: 156, is_trending: false, growth_weight: 0.8,
    foods: ["hotteok", "gyeranppang", "bungeoppang"],
  },
];

const clear = process.argv.includes("--clear");

try {
  if (clear) {
    const removed = await sql.query(
      "delete from public.shops where thumbnail_url like $1 returning id",
      ["/demo/%"],
    );
    console.log(`[seed-shops] removed ${removed.length} demo shops ✓`);
    process.exit(0);
  }

  const present = await sql.query(
    "select count(*)::int as n from public.shops where thumbnail_url like $1",
    ["/demo/%"],
  );
  if ((present[0]?.n ?? 0) > 0) {
    console.log(
      `[seed-shops] ${present[0].n} demo shops already present — nothing to add.`,
    );
    process.exit(0);
  }

  let shopCount = 0;
  let foodCount = 0;
  for (const shop of SHOPS) {
    const weeklyView = Math.round(shop.view_count * 0.28);
    const weeklyLike = Math.round(shop.like_count * 0.28);
    const firstFood = F[shop.foods[0]];
    const [row] = await sql.query(
      `insert into public.shops
        (name_ko, name_en, name_ja, name_es, description, translations,
         lat, lng, address, youtube_shorts_url, thumbnail_url, hashtags,
         price_range, view_count, like_count, weekly_view_count,
         weekly_like_count, growth_weight, is_trending)
       values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       returning id`,
      [
        shop.name_ko, shop.name_en, shop.name_ja, shop.name_es,
        shop.description, JSON.stringify(shop.translations),
        shop.lat, shop.lng, shop.address, shop.youtube_shorts_url,
        firstFood.image_url, shop.hashtags, shop.price_range,
        shop.view_count, shop.like_count, weeklyView, weeklyLike,
        shop.growth_weight, shop.is_trending,
      ],
    );
    const shopId = row.id;
    shopCount += 1;
    let order = 0;
    for (const key of shop.foods) {
      const f = F[key];
      await sql.query(
        `insert into public.shop_foods
          (shop_id, name_ko, name_en, name_ja, name_es, description,
           translations, image_url, price_range, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)`,
        [
          shopId, f.name_ko, f.name_en, f.name_ja, f.name_es, f.description,
          JSON.stringify(f.translations), f.image_url, f.price_range, order,
        ],
      );
      order += 1;
      foodCount += 1;
    }
  }
  console.log(`[seed-shops] inserted ${shopCount} shops, ${foodCount} foods ✓`);
} catch (err) {
  console.error("[seed-shops] FAILED:", err?.message || err);
  process.exit(1);
}
