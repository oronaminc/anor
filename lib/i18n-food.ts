import type { Food } from "./types";

/**
 * Multilingual food data strategy
 * --------------------------------
 *  - Names use dedicated columns: name_ko / name_en / name_ja / name_es.
 *  - Descriptions use the JSONB `translations` column keyed by locale,
 *    e.g. { "en": "...", "ja": "...", "es": "..." }. The base `description`
 *    column is the Korean (default) text.
 *  - Everything falls back gracefully: a missing localized value resolves to
 *    English, then Korean, so content is never blank.
 */

export function localizedName(
  food: Pick<Food, "name_ko" | "name_en" | "name_ja" | "name_es">,
  locale: string,
): string {
  switch (locale) {
    case "en":
      return food.name_en || food.name_ko;
    case "ja":
      return food.name_ja || food.name_en || food.name_ko;
    case "es":
      return food.name_es || food.name_en || food.name_ko;
    case "ko":
    default:
      return food.name_ko;
  }
}

/** Secondary (romanized / English) name shown under the primary name. */
export function secondaryName(
  food: Pick<Food, "name_ko" | "name_en">,
  locale: string,
): string | null {
  if (locale === "ko") return food.name_en;
  return food.name_en && food.name_en !== food.name_ko ? food.name_en : null;
}

export function localizedDescription(
  food: Pick<Food, "description" | "translations">,
  locale: string,
): string | null {
  if (locale === "ko") return food.description;
  return food.translations?.[locale] || food.description;
}
