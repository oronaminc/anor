"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { AppearanceSheet } from "@/components/AppearanceSheet";

export function SiteHeader() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 glass">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt={t("appName")}
            width={36}
            height={36}
            unoptimized
            priority
            className="size-9 shrink-0"
          />
          <span className="font-display text-[15px] font-extrabold uppercase tracking-wider gradient-text animate-holo">
            {t("appName")}
          </span>
        </Link>
        <AppearanceSheet />
      </div>
    </header>
  );
}
