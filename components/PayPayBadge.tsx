import { cn } from "@/lib/utils";

/**
 * "PayPay" badge — shown on shops that accept PayPay, Japan's most-used QR
 * payment (LINE Pay merged into PayPay in 2025). PayPay's brand red is an
 * intentional functional accent in the otherwise-monochrome UI. The label is a
 * brand name, so it isn't translated. No hooks → server or client components.
 */
export function PayPayBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md bg-[#ff0033] px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white",
        className,
      )}
    >
      PayPay
    </span>
  );
}
