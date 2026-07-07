"use server";

import { cookies } from "next/headers";
import { defaultLocale, isLocale, locales, type Locale } from "./config";

const COOKIE_NAME = "NEXT_LOCALE";

/**
 * Resolve the active locale. The app targets first-time Japanese visitors, so
 * we ALWAYS start in Japanese (defaultLocale) and ignore the browser's
 * Accept-Language — only an explicit choice (the NEXT_LOCALE cookie set by the
 * language switcher) overrides it.
 */
export async function getUserLocale(): Promise<Locale> {
  const cookieLocale = cookies().get(COOKIE_NAME)?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;
  return defaultLocale;
}

/** Persist the user's locale choice (1 year cookie). */
export async function setUserLocale(locale: Locale) {
  if (!isLocale(locale)) return;
  cookies().set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
