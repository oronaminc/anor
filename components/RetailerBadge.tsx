"use client";

import { useLocale } from "next-intl";

import { cn } from "@/lib/utils";
import { retailerMeta } from "@/lib/retailers";

/**
 * Small brand chip for a retailer (올리브영 / 다이소). The brand accent hex is a
 * functional accent in the monochrome UI, like the PayPay red and certified
 * blue. Renders nothing for an unknown retailer.
 */
export function RetailerBadge({
  retailer,
  className,
}: {
  retailer: string;
  className?: string;
}) {
  const locale = useLocale();
  const meta = retailerMeta(retailer);
  if (!meta) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white",
        className,
      )}
      style={{ backgroundColor: meta.accent }}
    >
      <span aria-hidden>{meta.emoji}</span>
      {locale === "ja" ? meta.ja : meta.ko}
    </span>
  );
}
