/**
 * Retail pillar metadata — Olive Young (K-beauty) & Daiso (goods). Parallel to
 * the street-food model: a `product` belongs to a `retailer` and a category.
 * Everything here is pure/isomorphic (no DB, no server-only) so it can be used
 * in client filter chips and server pages alike. Labels are localized (ja/ko).
 *
 * Brand accent hexes are functional accents (like the trending fire, PayPay red
 * and the certified blue) in the otherwise-monochrome UI — used sparingly for
 * the retailer badge and the active category chip only.
 */

export type Retailer = "olive_young" | "daiso";

export interface RetailerMeta {
  code: Retailer;
  ko: string;
  ja: string;
  /** short tagline shown under the ranking title */
  tagline_ko: string;
  tagline_ja: string;
  emoji: string;
  /** brand accent hex (functional, used for badge + active chip) */
  accent: string;
  /** home path for this retailer's ranking */
  href: string;
}

export const RETAILERS: Record<Retailer, RetailerMeta> = {
  olive_young: {
    code: "olive_young",
    ko: "올리브영",
    ja: "オリーブヤング",
    tagline_ko: "명동에서 사는 K-뷰티 인기 랭킹",
    tagline_ja: "明洞で買えるK-ビューティー人気ランキング",
    emoji: "🫒",
    accent: "#00A54F",
    href: "/beauty",
  },
  daiso: {
    code: "daiso",
    ko: "다이소",
    ja: "ダイソー",
    tagline_ko: "천원부터, 다이소 필수템 랭킹",
    tagline_ja: "1000ウォンから、ダイソー人気アイテムランキング",
    emoji: "🛍️",
    accent: "#E60012",
    href: "/daiso",
  },
};

export const RETAILER_CODES: Retailer[] = ["olive_young", "daiso"];

export function isRetailer(v: string): v is Retailer {
  return v === "olive_young" || v === "daiso";
}

export interface RetailCategory {
  code: string;
  ko: string;
  ja: string;
  emoji: string;
}

/**
 * Fixed category taxonomy per retailer. The seed maps each product to one of
 * these codes; `retailCategoryLabel` localizes, and unknown codes fall back to
 * the retailer's "기타 / その他" bucket.
 */
export const RETAIL_CATEGORIES: Record<Retailer, RetailCategory[]> = {
  olive_young: [
    { code: "skincare", ko: "스킨케어", ja: "スキンケア", emoji: "🧴" },
    { code: "mask", ko: "마스크팩", ja: "マスクパック", emoji: "🧖" },
    { code: "suncare", ko: "선케어", ja: "日焼け止め", emoji: "☀️" },
    { code: "cleansing", ko: "클렌징", ja: "クレンジング", emoji: "🫧" },
    { code: "makeup-base", ko: "베이스 메이크업", ja: "ベースメイク", emoji: "💧" },
    { code: "makeup-lip", ko: "립·컬러", ja: "リップ・カラー", emoji: "💄" },
    { code: "haircare", ko: "헤어", ja: "ヘア", emoji: "💆" },
    { code: "bodycare", ko: "바디케어", ja: "ボディケア", emoji: "🧴" },
  ],
  daiso: [
    { code: "beauty-cosmetics", ko: "화장품", ja: "コスメ", emoji: "💄" },
    { code: "beauty-tools", ko: "뷰티소품", ja: "ビューティー小物", emoji: "🪮" },
    { code: "kitchen", ko: "주방", ja: "キッチン", emoji: "🍳" },
    { code: "stationery", ko: "문구", ja: "文具", emoji: "✏️" },
    { code: "storage", ko: "수납·정리", ja: "収納", emoji: "📦" },
    { code: "cleaning", ko: "청소·생활", ja: "掃除・生活", emoji: "🧽" },
    { code: "interior", ko: "인테리어", ja: "インテリア", emoji: "🕯️" },
    { code: "phone-accessory", ko: "디지털·폰", ja: "デジタル・スマホ", emoji: "🔌" },
  ],
};

export function retailerMeta(retailer: string): RetailerMeta | null {
  return isRetailer(retailer) ? RETAILERS[retailer] : null;
}

export function retailerName(retailer: string, locale: string): string {
  const m = retailerMeta(retailer);
  if (!m) return retailer;
  return locale === "ja" ? m.ja : m.ko;
}

export function retailCategory(
  retailer: Retailer,
  code: string | null | undefined,
): RetailCategory | null {
  if (!code) return null;
  return RETAIL_CATEGORIES[retailer]?.find((c) => c.code === code) ?? null;
}

export function retailCategoryLabel(
  retailer: Retailer,
  code: string | null | undefined,
  locale: string,
): string {
  const c = retailCategory(retailer, code);
  if (!c) return locale === "ja" ? "その他" : "기타";
  return locale === "ja" ? c.ja : c.ko;
}
