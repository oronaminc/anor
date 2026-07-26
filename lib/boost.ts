import type { NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Manual engagement boosts (admin "+1K" buttons and the Telegram bot). Adds to
 * the stored view_count / like_count (and keeps the weekly counters in step),
 * keeping view_count ≥ like_count. Shared by the server action and the webhook.
 */
export const BOOST_AMOUNT = 1000;

export type BoostKind = "view" | "like";

type Sql = NeonQueryFunction<false, false>;

export async function applyBoost(
  sql: Sql,
  shopId: string,
  kind: BoostKind,
  amount: number = BOOST_AMOUNT,
): Promise<void> {
  if (kind === "view") {
    await sql`
      UPDATE shops
         SET synthetic_view_count = synthetic_view_count + ${amount}
       WHERE id = ${shopId}
    `;
  } else {
    // Add synthetic likes, lifting synthetic views if needed so the displayed
    // total views stay strictly above the total likes. (Atomic — the cap is
    // computed from the live row, so it's race-free. lib/counts.likeBoostViewLift
    // mirrors this math and is unit-tested.)
    await sql`
      UPDATE shops SET
        synthetic_like_count = synthetic_like_count + ${amount},
        synthetic_view_count = synthetic_view_count + greatest(
          0,
          (like_count + synthetic_like_count + ${amount})
            - (view_count + synthetic_view_count) + 1
        )
      WHERE id = ${shopId}
    `;
  }
}

/**
 * One automated growth tick for a SINGLE shop: add `viewInc` synthetic views and
 * up to `likeInc` synthetic likes, capped atomically so the displayed total
 * views always stay strictly above total likes. lib/counts.cappedLikeInc mirrors
 * this cap and is unit-tested; the SQL here is the race-free source of truth.
 *
 * The cron uses `growAllShops` instead — one statement for the whole table. Keep
 * this for targeted/manual growth of one shop.
 */
export async function applyGrowthTick(
  sql: Sql,
  shopId: string,
  viewInc: number,
  likeInc: number,
): Promise<void> {
  await sql`
    UPDATE shops SET
      synthetic_view_count = synthetic_view_count + ${viewInc},
      synthetic_like_count = synthetic_like_count + least(
        ${likeInc},
        greatest(
          0,
          (view_count + synthetic_view_count + ${viewInc})
            - (like_count + synthetic_like_count) - 1
        )
      )
    WHERE id = ${shopId}
  `;
}

/**
 * The growth cron's workhorse: grow EVERY shop in ONE round-trip.
 *
 * This used to be a `SELECT id FROM shops` followed by one `applyGrowthTick`
 * per row — 146 sequential requests per tick, every 5 minutes, which kept the
 * Neon compute permanently awake and burned the whole monthly compute quota
 * (the DB then answers every query with HTTP 402 and the site renders empty).
 * Doing it set-based lets the compute go back to sleep between runs.
 *
 * The per-shop randomness is preserved — `random()` is volatile, so Postgres
 * draws it once per row — as is the invariant (total views > total likes),
 * using exactly the cap in `applyGrowthTick`.
 *
 * `multiplier` is how many 5-minute ticks this one call stands for, so a
 * sparser schedule grows at the same rate per hour.
 *
 * Returns the number of shops grown.
 */
export async function growAllShops(
  sql: Sql,
  multiplier = 1,
): Promise<number> {
  const rows = await sql`
    UPDATE shops s SET
      synthetic_view_count = s.synthetic_view_count + g.view_inc,
      synthetic_like_count = s.synthetic_like_count + least(
        g.like_inc,
        greatest(
          0,
          (s.view_count + s.synthetic_view_count + g.view_inc)
            - (s.like_count + s.synthetic_like_count) - 1
        )
      )
    FROM (
      SELECT id,
             view_inc,
             round(view_inc * (0.05 + random() * 0.12))::int AS like_inc
        FROM (
          SELECT id,
                 greatest(1, round(
                   (5 + random() * 22)
                     -- a 0 or NULL weight means "normal", matching the old JS
                     * coalesce(nullif(growth_weight, 0), 1)
                     * (CASE WHEN is_trending THEN 2 ELSE 1 END)
                     * ${multiplier}
                 ))::int AS view_inc
            FROM shops
        ) r
    ) g
    WHERE s.id = g.id
    RETURNING 1
  `;
  return rows.length;
}
