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
  is_trending: boolean;
  price_range: string | null;
  created_at: string;
};

export type FoodInput = Omit<Food, "id" | "view_count" | "created_at">;

export type SortKey = "popular" | "latest";

export type Database = {
  public: {
    Tables: {
      foods: {
        Row: Food;
        Insert: Partial<Food> & { name_ko: string };
        Update: Partial<Food>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      increment_view_count: {
        Args: { food_id: string };
        Returns: number;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
