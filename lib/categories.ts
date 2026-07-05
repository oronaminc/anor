/**
 * Food categories for filtering the map and the home feed. A shop stores 1+
 * category CODES in `shops.categories` (separate from its specific menu foods)
 * so filtering stays simple. The set is intentionally fine-grained (≈20, each
 * holding ≤10 shops) so no single category is unwieldy on the map. Labels are
 * localized (ja default). Assign via the admin form, the CSV `categories`
 * column, or bulk from foods with `scripts/_categorize.mjs`.
 */
export type CategoryCode =
  | "dakkochi"
  | "yangkochi"
  | "kochi"
  | "tteok"
  | "mandu"
  | "japchae"
  | "hotteok"
  | "bakery"
  | "mochi"
  | "waffle"
  | "icecream"
  | "hotdog"
  | "steak"
  | "chicken"
  | "lobster"
  | "shellfish"
  | "drink"
  | "fruit"
  | "roasted"
  | "fried";

export interface Category {
  code: CategoryCode;
  ja: string;
  ko: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { code: "dakkochi", ja: "チキン串", ko: "닭꼬치", emoji: "🍗" },
  { code: "yangkochi", ja: "ラム串", ko: "양꼬치", emoji: "🐑" },
  { code: "kochi", ja: "串盛り・海鮮串", ko: "모둠·해물꼬치", emoji: "🍢" },
  { code: "tteok", ja: "トッポギ・粉食", ko: "떡볶이·분식", emoji: "🍲" },
  { code: "mandu", ja: "マンドゥ・キンパ", ko: "만두·김밥", emoji: "🥟" },
  { code: "japchae", ja: "チャプチェ・炒め物", ko: "잡채·볶음", emoji: "🍜" },
  { code: "hotteok", ja: "ホットク・鯛焼き", ko: "호떡·풀빵", emoji: "🥮" },
  { code: "bakery", ja: "ベーカリー", ko: "베이커리·빵", emoji: "🥐" },
  { code: "mochi", ja: "餅・カンジョン", ko: "모찌·강정", emoji: "🍡" },
  { code: "waffle", ja: "ワッフル・クレープ", ko: "와플·크레페", emoji: "🧇" },
  { code: "icecream", ja: "アイス", ko: "아이스크림", emoji: "🍦" },
  { code: "hotdog", ja: "ホットドッグ", ko: "핫도그", emoji: "🌭" },
  { code: "steak", ja: "ステーキ・焼肉", ko: "스테이크·구이", emoji: "🥩" },
  { code: "chicken", ja: "チキン・ケバブ", ko: "치킨·닭·케밥", emoji: "🍖" },
  { code: "lobster", ja: "ロブスター・エビ", ko: "랍스터·새우", emoji: "🦞" },
  { code: "shellfish", ja: "貝・イカ・タコ", ko: "조개·오징어·문어", emoji: "🦑" },
  { code: "drink", ja: "ドリンク・ジュース", ko: "음료·주스", emoji: "🧃" },
  { code: "fruit", ja: "フルーツ・タンフル", ko: "과일·탕후루", emoji: "🍓" },
  { code: "roasted", ja: "焼き芋・栗", ko: "군것질", emoji: "🌰" },
  { code: "fried", ja: "ポテト・揚げ物", ko: "감자·튀김", emoji: "🍟" },
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
