export const locales = ["ko", "en", "ja", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export const localeNames: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  ja: "🇯🇵",
  es: "🇪🇸",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
