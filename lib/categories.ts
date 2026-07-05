/**
 * Broad food categories used to filter the map and the home feed. A shop stores
 * 1+ category CODES in `shops.categories` (separate from its specific menu
 * foods) so filtering stays simple — e.g. the "hotdog" category holds a stall
 * whose foods are 치즈핫도그 / 왕소시지핫도그. Labels are localized (ja default).
 */
export type CategoryCode =
  | "skewer"
  | "bread"
  | "sweet"
  | "ice"
  | "drink"
  | "bunsik"
  | "hotdog"
  | "seafood"
  | "meat"
  | "fried"
  | "fruit"
  | "roasted";

export interface Category {
  code: CategoryCode;
  ja: string;
  ko: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { code: "skewer", ja: "串もの", ko: "꼬치", emoji: "🍢" },
  { code: "bread", ja: "ホットク・パン", ko: "호떡·빵", emoji: "🥞" },
  { code: "sweet", ja: "スイーツ", ko: "디저트", emoji: "🍡" },
  { code: "ice", ja: "アイス", ko: "아이스크림", emoji: "🍦" },
  { code: "drink", ja: "ドリンク", ko: "음료", emoji: "🧃" },
  { code: "bunsik", ja: "粉食", ko: "분식", emoji: "🍲" },
  { code: "hotdog", ja: "ホットドッグ", ko: "핫도그", emoji: "🌭" },
  { code: "seafood", ja: "シーフード", ko: "해산물", emoji: "🦞" },
  { code: "meat", ja: "肉・焼き", ko: "고기·구이", emoji: "🍖" },
  { code: "fried", ja: "揚げ物", ko: "튀김", emoji: "🍤" },
  { code: "fruit", ja: "フルーツ", ko: "과일", emoji: "🍓" },
  { code: "roasted", ja: "焼き芋・栗", ko: "군것질", emoji: "🌰" },
];

const BY_CODE = new Map(CATEGORIES.map((c) => [c.code, c]));

/** Localized label for a category code (falls back to the code itself). */
export function categoryLabel(code: string, locale: string): string {
  const c = BY_CODE.get(code as CategoryCode);
  if (!c) return code;
  return locale === "ja" ? c.ja : c.ko;
}

export function categoryEmoji(code: string): string {
  return BY_CODE.get(code as CategoryCode)?.emoji ?? "🍴";
}

export function isCategory(code: string): code is CategoryCode {
  return BY_CODE.has(code as CategoryCode);
}
