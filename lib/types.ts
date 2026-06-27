export type FoodTranslations = {
  /** Localized descriptions keyed by locale code, e.g. { en: "...", ja: "..." } */
  [locale: string]: string;
};

export type Food = {
  id: string;
  name_ko: string;
  name_en: string | null;
  name_ja: string | null;
  name_es: string | null;
  description: string | null;
  translations: FoodTranslations | null;
  category: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  youtube_shorts_url: string | null;
  thumbnail_url: string | null;
  hashtags: string[] | null;
  view_count: number;
  like_count: number;
  is_trending: boolean;
  price_range: string | null;
  created_at: string;
};

export type FoodInput = Omit<
  Food,
  "id" | "view_count" | "like_count" | "created_at"
>;

export type SortKey = "popular" | "latest";

// ---------------------------------------------------------------------
// Shop / menu model (가게 + 음식들) — the new primary model.
// A shop is the unit of engagement; it has one map point + one youtube link
// and many menu foods.
// ---------------------------------------------------------------------

/** A menu food belonging to a shop (photo is user-provided). */
export type ShopFood = {
  id: string;
  shop_id: string;
  name_ko: string;
  name_en: string | null;
  name_ja: string | null;
  name_es: string | null;
  description: string | null;
  translations: FoodTranslations | null;
  image_url: string | null;
  price_range: string | null;
  sort_order: number;
  created_at: string;
};

export type Shop = {
  id: string;
  name_ko: string;
  name_en: string | null;
  name_ja: string | null;
  name_es: string | null;
  description: string | null;
  translations: FoodTranslations | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  youtube_shorts_url: string | null;
  thumbnail_url: string | null;
  hashtags: string[] | null;
  price_range: string | null;
  view_count: number;
  like_count: number;
  weekly_view_count: number;
  weekly_like_count: number;
  week_start: string;
  growth_weight: number;
  is_trending: boolean;
  created_at: string;
  /** Organic views/likes per minute, attached server-side for the live ticker
   *  (not a DB column). 0 when growth is off. */
  view_rate_per_min?: number;
  like_rate_per_min?: number;
};

/** A shop with its menu foods attached — the card / detail shape. */
export type ShopWithFoods = Shop & { foods: ShopFood[] };

export type ShopFoodInput = Omit<
  ShopFood,
  "id" | "shop_id" | "created_at"
>;

export type ShopInput = Omit<
  Shop,
  | "id"
  | "view_count"
  | "like_count"
  | "weekly_view_count"
  | "weekly_like_count"
  | "week_start"
  | "growth_weight"
  | "created_at"
>;

/** One like per anonymized IP per food (sha256(ip + salt)). */
export type FoodLike = {
  food_id: string;
  ip_hash: string;
  created_at: string;
};

/** A collected search query, for the admin analytics dashboard. */
export type SearchEvent = {
  id: string;
  query: string;
  normalized: string;
  locale: string | null;
  results_count: number | null;
  ip_hash: string | null;
  created_at: string;
};
