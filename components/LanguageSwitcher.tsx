"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

import { setUserLocale } from "@/i18n/locale";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function select(locale: Locale) {
    if (locale === active) return;
    startTransition(async () => {
      await setUserLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-2 gap-2" aria-busy={pending}>
      {locales.map((locale) => {
        const isActive = locale === active;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => select(locale)}
            aria-pressed={isActive}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <span className="text-base">{localeFlags[locale]}</span>
            {localeNames[locale]}
          </button>
        );
      })}
    </div>
  );
}
