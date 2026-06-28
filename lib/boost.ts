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
    // total views stay strictly above the total likes.
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
