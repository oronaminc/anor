"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { AppearanceSheet } from "@/components/AppearanceSheet";

export function SiteHeader() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight"
        >
          <span className="text-xl">🍢</span>
          <span>{t("appName")}</span>
        </Link>
        <AppearanceSheet />
      </div>
    </header>
  );
}
