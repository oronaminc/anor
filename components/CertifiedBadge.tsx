import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "인증" badge for officially certified street vendors (구청/서울시 정식 노점포
 * 인증) — a clean blue verified seal. Blue is an intentional functional accent in
 * the otherwise-monochrome UI, like the trending fire and LINE Pay green. No
 * hooks → usable in server or client components.
 */
export function CertifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-md bg-[#2563eb] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white",
        className,
      )}
    >
      <BadgeCheck className="size-3" strokeWidth={2.5} />
      인증
    </span>
  );
}
