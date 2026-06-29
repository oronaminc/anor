import { cn } from "@/lib/utils";

/**
 * "LINE Pay" badge — shown on shops that accept LINE Pay (popular with Japanese
 * visitors). LINE's brand green is an intentional functional accent in the
 * otherwise-monochrome UI (like the trending fire). The label is a brand name,
 * so it isn't translated. No hooks → usable in server or client components.
 */
export function LinePayBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md bg-[#06C755] px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white",
        className,
      )}
    >
      LINE&nbsp;Pay
    </span>
  );
}
