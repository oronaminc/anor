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
const MINUTE_MS = 60 * 1000;

// Organic views per MINUTE, per speed level, for a normal (weight 1) shop.
// Kept gentle so the seeded base + each shop's growth_weight keep numbers
// varied and believable; the live ticker still shows them climbing. Speed 0
// disables organic growth entirely.
const VIEW_RATE_PER_MIN = 1.5;
// Trending shops grow noticeably faster than the rest.
const TREND_MULTIPLIER = 2.0;
// Per-shop organic like ratio range (so like/view ratios differ between shops).
const MIN_LIKE_RATIO = 0.07;
const MAX_LIKE_RATIO = 0.2;

/** Deterministic per-shop like ratio in [MIN, MAX], from the shop id (FNV-1a),
 *  so shops don't all share the same like/view ratio. */
export function likeRatioFor(id: string | undefined): number {
  if (!id) return 0.15;
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h = (h ^ id.charCodeAt(i)) >>> 0;
    h = (h * 16777619) >>> 0;
  }
  return MIN_LIKE_RATIO + ((h % 1000) / 1000) * (MAX_LIKE_RATIO - MIN_LIKE_RATIO);
}

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

type GrowthShop = {
  id?: string;
  weekly_view_count: number;
  weekly_like_count: number;
  week_start: string;
  growth_weight: number;
  is_trending: boolean;
};

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
  const elapsedMinutes = Math.max(0, (now - weekStartMs) / MINUTE_MS);
  const weight = Number.isFinite(shop.growth_weight) ? shop.growth_weight : 1;
  const trend = shop.is_trending ? TREND_MULTIPLIER : 1;

  const organicViews = Math.floor(
    VIEW_RATE_PER_MIN * s * weight * trend * elapsedMinutes,
  );
  const organicLikes = Math.floor(organicViews * likeRatioFor(shop.id));

  const likes = baseLikes + organicLikes;
  let views = baseViews + organicViews;
  // Guarantee views > likes whenever there are any likes to compare against.
  if (likes > 0 && views <= likes) views = likes + 1;
  return { views, likes };
}

/** Organic growth rate (views/likes per minute) for the live ticker. */
export function organicRatePerMin(
  shop: GrowthShop,
  speed: number,
): { views: number; likes: number } {
  const s = clampSpeed(speed);
  const weight = Number.isFinite(shop.growth_weight) ? shop.growth_weight : 1;
  const trend = shop.is_trending ? TREND_MULTIPLIER : 1;
  const views = VIEW_RATE_PER_MIN * s * weight * trend;
  return { views, likes: views * likeRatioFor(shop.id) };
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
