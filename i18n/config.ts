export const locales = ["ja", "ko"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ja";

export const localeNames: Record<Locale, string> = {
  ja: "日本語",
  ko: "한국어",
};

export const localeFlags: Record<Locale, string> = {
  ja: "🇯🇵",
  ko: "🇰🇷",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
