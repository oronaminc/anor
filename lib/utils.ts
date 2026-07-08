import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compact, Instagram-style count: 1.2K, 12K, 1.2M.
 *  - < 1,000        → the number as-is (e.g. 999)
 *  - < 1,000,000    → "K" (one decimal under 10K, integer above: 1.5K, 12K, 340K)
 *  - ≥ 1,000,000    → "M" with one decimal (1.2M, trims a trailing .0 → 2M)
 */
export function formatViewCount(count: number): string {
  if (count < 1000) return String(count);
  if (count < 1_000_000) return `${Math.round(count / 100) / 10}K`;
  return `${Math.round(count / 100_000) / 10}M`;
}

/**
 * Whether an image URL should skip Next.js optimization: our demo art (`/demo/`)
 * and any SVG keep their own animation. Query-string safe — a cache-busting
 * `?v=…` suffix on the URL won't fool the `.svg` check.
 */
export function isUnoptimizedImage(url: string): boolean {
  const path = url.split("?")[0].toLowerCase();
  return path.startsWith("/demo/") || path.endsWith(".svg");
}
