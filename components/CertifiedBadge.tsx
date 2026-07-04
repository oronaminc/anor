"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "인증 / 認証" badge for officially certified street vendors (구청/서울시 정식
 * 노점포 인증) — a clean blue verified seal. The label is localized (認証 in
 * Japanese, 인증 in Korean). Blue is an intentional functional accent in the
 * otherwise-monochrome UI, like the trending fire and LINE Pay green.
 */
export function CertifiedBadge({ className }: { className?: string }) {
  const t = useTranslations("badge");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-md bg-[#2563eb] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white",
        className,
      )}
    >
      <BadgeCheck className="size-3" strokeWidth={2.5} />
      {t("certified")}
    </span>
  );
}
