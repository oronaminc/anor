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
