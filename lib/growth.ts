import type { Shop } from "./types";

/**
 * Weekly engagement + time-based "organic" growth (no cron).
 *
 * The number shown publicly for a shop is THIS WEEK's count:
 *   displayed = (real this-week clicks/boosts, reset every Mon 00:00 KST)
 *             + organic(elapsed since week start · speed · shop weight · trending)
 *
 * Everything resets when the KST week rolls over (a stored week_start older than
 * the current week is treated as 0). Views always exceed likes. With speed 0
 * there is no organic growth (only real clicks/boosts show).
 */

export const MIN_SPEED = 0;
export const MAX_SPEED = 5;
export const DEFAULT_GROWTH_SPEED = 2;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Organic views per hour, per speed level, for a normal (weight 1) shop.
const VIEW_RATE_PER_HOUR = 9;
// Trending shops grow this much faster than the rest.
const TREND_MULTIPLIER = 2.5;
// Organic likes accrue as this fraction of organic views (keeps views > likes).
const LIKE_RATIO = 0.12;

/** Epoch ms of the current KST week's Monday 00:00. */
export function kstWeekStartMs(now: number): number {
  const kst = new Date(now + KST_OFFSET_MS);
  const dow = (kst.getUTCDay() + 6) % 7; // 0 = Monday
  const midnightUtc = Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate(),
  );
  return midnightUtc - dow * 24 * HOUR_MS - KST_OFFSET_MS;
}

/** Parse a stored `week_start` (a YYYY-MM-DD date) as KST-midnight epoch ms. */
function storedWeekMs(weekStart: string | null | undefined): number {
  if (!weekStart) return NaN;
  const t = Date.parse(`${weekStart}T00:00:00+09:00`);
  return Number.isFinite(t) ? t : NaN;
}

export function clampSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return DEFAULT_GROWTH_SPEED;
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.round(speed)));
}

type GrowthShop = Pick<
  Shop,
  | "weekly_view_count"
  | "weekly_like_count"
  | "week_start"
  | "growth_weight"
  | "is_trending"
>;

/** Displayed this-week view/like counts (real + organic), views > likes. */
export function computeDisplay(
  shop: GrowthShop,
  speed: number,
  now: number,
): { views: number; likes: number } {
  const weekStartMs = kstWeekStartMs(now);
  const stored = storedWeekMs(shop.week_start);
  const stale = !Number.isFinite(stored) || stored < weekStartMs;

  const baseViews = stale ? 0 : Math.max(0, shop.weekly_view_count ?? 0);
  const baseLikes = stale ? 0 : Math.max(0, shop.weekly_like_count ?? 0);

  const s = clampSpeed(speed);
  const elapsedHours = Math.max(0, (now - weekStartMs) / HOUR_MS);
  const weight = Number.isFinite(shop.growth_weight) ? shop.growth_weight : 1;
  const trend = shop.is_trending ? TREND_MULTIPLIER : 1;

  const organicViews = Math.floor(
    VIEW_RATE_PER_HOUR * s * weight * trend * elapsedHours,
  );
  const organicLikes = Math.floor(organicViews * LIKE_RATIO);

  const likes = baseLikes + organicLikes;
  let views = baseViews + organicViews;
  // Guarantee views > likes whenever there are any likes to compare against.
  if (likes > 0 && views <= likes) views = likes + 1;
  return { views, likes };
}

/** Read the 0–5 growth speed from a settings row; falls back to the default. */
export async function getGrowthSpeed(
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>,
): Promise<number> {
  try {
    const rows = (await sql`
      SELECT value FROM settings WHERE key = 'growth_speed' LIMIT 1
    `) as Array<{ value?: string }>;
    const parsed = parseInt(rows[0]?.value ?? "", 10);
    return clampSpeed(parsed);
  } catch {
    return DEFAULT_GROWTH_SPEED;
  }
}

/** "6/23 – 6/29" (KST) for the current week — shown on the trending page. */
export function formatWeekRange(now: number): string {
  const startMs = kstWeekStartMs(now);
  const endMs = startMs + 6 * 24 * HOUR_MS;
  const fmt = (ms: number) => {
    const d = new Date(ms + KST_OFFSET_MS);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  };
  return `${fmt(startMs)} – ${fmt(endMs)}`;
}
