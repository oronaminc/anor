import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";

/**
 * Read-side caching in front of Neon.
 *
 * WHY: the database is a serverless Postgres on a free plan, where the budget
 * is *compute time*, not queries — the compute wakes on any query and only
 * auto-suspends after ~5 idle minutes. Public pages are `force-dynamic`, so
 * before this every single page view ran its queries and re-woke the compute;
 * ordinary traffic spread through the day kept it awake around the clock and
 * exhausted the monthly quota (every query then fails with HTTP 402 and the
 * site renders empty — see CLAUDE.md).
 *
 * So reads go through Next's Data Cache: the first request after a window pays
 * for the query and everyone else is served from cache, which lets the compute
 * sleep between windows. The TTL is deliberately much longer than the suspend
 * delay — a 5-minute TTL would poke the database exactly often enough to keep
 * it permanently awake, which is the trap this is avoiding.
 *
 * Freshness is not sacrificed for admin edits: mutations call
 * `revalidateShops()` / `revalidateProducts()`, so content changes appear at
 * once. Only the engagement counts lag, and they already move in steps (the
 * hourly growth cron), so a page shows one consistent snapshot everywhere.
 */

/** Cache tags — mutations revalidate these to publish an edit immediately. */
export const CACHE_TAGS = {
  shops: "shops",
  products: "products",
} as const;

/**
 * Seconds a cached read stays valid. Must stay WELL above the database's
 * ~5-minute auto-suspend delay, or the cache refresh itself keeps the compute
 * awake and the whole point is lost. Default 1 hour, matching the growth cron
 * so reads and the cron wake the compute in the same window.
 */
export const CACHE_TTL_SECONDS = Number(process.env.DB_CACHE_TTL_SECONDS) || 3600;

/**
 * Wrap a DB read in the shared Data Cache.
 *
 * `keyParts` must capture every argument the loader depends on — the cache is
 * shared across users, so anything request-specific (cookies, IP, session) must
 * NOT be read inside `loader`.
 */
export function cachedRead<Args extends unknown[], T>(
  keyParts: string[],
  loader: (...args: Args) => Promise<T>,
  tags: string[],
): (...args: Args) => Promise<T> {
  return unstable_cache(loader, keyParts, {
    revalidate: CACHE_TTL_SECONDS,
    tags,
  });
}

/**
 * Publish a content change now instead of waiting out the TTL. Call from every
 * admin mutation — without it an edit would appear up to CACHE_TTL_SECONDS late.
 *
 * NOT for engagement counts: a view or like must never bust the cache, or every
 * visit would trigger a fresh query and undo the savings. Counts ride along on
 * the next refresh, which is why the growth cron and the TTL share a period.
 */
export function revalidateShops(): void {
  revalidateTag(CACHE_TAGS.shops);
}

export function revalidateProducts(): void {
  revalidateTag(CACHE_TAGS.products);
}
