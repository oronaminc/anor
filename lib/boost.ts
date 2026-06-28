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
 * One automated growth tick (the 5-min cron): add `viewInc` synthetic views and
 * up to `likeInc` synthetic likes, capped atomically so the displayed total
 * views always stay strictly above total likes. lib/counts.cappedLikeInc mirrors
 * this cap and is unit-tested; the SQL here is the race-free source of truth.
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
