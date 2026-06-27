import type { NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Manual engagement boosts (admin "+1K" buttons and the Telegram bot). Adds to
 * BOTH the all-time and this-week counters, with the same lazy Monday-00:00-KST
 * weekly reset the SQL functions use, and keeps views ≥ likes at the raw level
 * (organic growth in computeDisplay keeps the displayed views strictly above
 * likes). Shared by the server action and the Telegram webhook.
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
      UPDATE shops SET
        view_count        = view_count + ${amount},
        weekly_view_count = (case when week_start < kst_week_start() then 0 else weekly_view_count end) + ${amount},
        weekly_like_count = (case when week_start < kst_week_start() then 0 else weekly_like_count end),
        week_start        = kst_week_start()
      WHERE id = ${shopId}
    `;
  } else {
    await sql`
      UPDATE shops SET
        like_count        = like_count + ${amount},
        weekly_like_count = (case when week_start < kst_week_start() then 0 else weekly_like_count end) + ${amount},
        weekly_view_count = greatest(
          (case when week_start < kst_week_start() then 0 else weekly_view_count end),
          (case when week_start < kst_week_start() then 0 else weekly_like_count end) + ${amount}
        ),
        view_count        = greatest(view_count, like_count + ${amount}),
        week_start        = kst_week_start()
      WHERE id = ${shopId}
    `;
  }
}
