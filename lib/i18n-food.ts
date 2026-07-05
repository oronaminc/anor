import type { Food } from "./types";

/**
 * Multilingual food data (the app ships Japanese + Korean only)
 * --------------------------------------------------------------
 *  - Names use dedicated columns: name_ko / name_ja (name_en/name_es stay in the
 *    DB but aren't shown).
 *  - Descriptions use the JSONB `translations` column keyed by locale (e.g.
 *    { "ja": "..." }); the base `description` column is the Korean text.
 *  - Everything falls back to Korean so content is never blank.
 */

export function localizedName(
  food: Pick<Food, "name_ko" | "name_ja">,
  locale: string,
): string {
  if (locale === "ja") return food.name_ja || food.name_ko;
  return food.name_ko;
}

/**
 * Subtitle under the primary name. Only the Japanese-default UI shows the
 * Korean original as a subtitle (a nice reference for JP users); the Korean UI
 * stays purely Korean — no Japanese subtitle.
 */
export function secondaryName(
  food: Pick<Food, "name_ko" | "name_ja">,
  locale: string,
): string | null {
  if (locale === "ja") {
    return food.name_ko && food.name_ko !== food.name_ja ? food.name_ko : null;
  }
  return null;
}

export function localizedDescription(
  food: Pick<Food, "description" | "translations">,
  locale: string,
): string | null {
  if (locale === "ko") return food.description;
  return food.translations?.[locale] || food.description;
}
