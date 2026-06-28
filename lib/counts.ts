/**
 * Pure count math — no DB, no server-only, so it's unit-testable. The displayed
 * number is the stored real count plus the stored synthetic (admin/automated)
 * count; both live in the DB, so the total is stable and identical on every
 * surface. The cap helpers mirror the SQL in lib/boost.ts and the growth cron,
 * and they guarantee the one invariant that matters: total views > total likes.
 */

type ViewCounts = { view_count: number; synthetic_view_count?: number };
type LikeCounts = { like_count: number; synthetic_like_count?: number };

export function totalViews(s: ViewCounts): number {
  return (s.view_count ?? 0) + (s.synthetic_view_count ?? 0);
}

export function totalLikes(s: LikeCounts): number {
  return (s.like_count ?? 0) + (s.synthetic_like_count ?? 0);
}

/**
 * For a growth tick that adds `viewInc` synthetic views and wants to add
 * `likeInc` synthetic likes: return the like increment actually allowed so that
 * total likes stay strictly below total views afterwards. Never negative.
 */
export function cappedLikeInc(
  s: ViewCounts & LikeCounts,
  viewInc: number,
  likeInc: number,
): number {
  const newTotalViews = totalViews(s) + Math.max(0, viewInc);
  const room = Math.max(0, newTotalViews - totalLikes(s) - 1);
  return Math.min(Math.max(0, likeInc), room);
}

/**
 * For an admin/Telegram "like" boost of `amount`: return how much to also add to
 * synthetic views so that total views stay strictly above total likes. Never
 * negative (0 when views already have room).
 */
export function likeBoostViewLift(
  s: ViewCounts & LikeCounts,
  amount: number,
): number {
  const newTotalLikes = totalLikes(s) + Math.max(0, amount);
  return Math.max(0, newTotalLikes - totalViews(s) + 1);
}
