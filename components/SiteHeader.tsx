"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { AppearanceSheet } from "@/components/AppearanceSheet";

export function SiteHeader() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 glass">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative flex size-8 items-center justify-center rounded-xl bg-holo text-base glow-sm animate-pulse-glow">
            🔥
          </span>
          <span className="font-display text-[15px] font-extrabold uppercase tracking-wider gradient-text animate-holo">
            {t("appName")}
          </span>
        </Link>
        <AppearanceSheet />
      </div>
    </header>
  );
}
