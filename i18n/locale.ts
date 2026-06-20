"use server";

import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, locales, type Locale } from "./config";

const COOKIE_NAME = "NEXT_LOCALE";

/**
 * Resolve the active locale: explicit cookie first, otherwise auto-detect from
 * the browser's Accept-Language header, falling back to the default (ko).
 */
export async function getUserLocale(): Promise<Locale> {
  const cookieLocale = cookies().get(COOKIE_NAME)?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const accept = headers().get("accept-language") ?? "";
  const preferred = accept
    .split(",")
    .map((part) => part.split(";")[0]?.trim().slice(0, 2).toLowerCase())
    .find((code) => code && isLocale(code));

  return (preferred as Locale) ?? defaultLocale;
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
