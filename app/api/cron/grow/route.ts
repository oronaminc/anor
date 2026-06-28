import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { applyGrowthTick } from "@/lib/boost";

export const dynamic = "force-dynamic";

/**
 * Periodic "organic" growth — called every ~5 minutes by the GitHub Actions
 * cron (.github/workflows/grow.yml). Adds a small RANDOM amount to each shop's
 * SYNTHETIC counts, persisted in the DB, so the displayed number (real +
 * synthetic) is always stable and consistent. Views grow faster than likes and
 * the like bump is capped so total likes can never reach total views.
 *
 * Secured by the x-cron-secret header (CRON_SECRET). No-op without it.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json({ ok: false, error: "no db" }, { status: 503 });
  }

  try {
    const sql = getSql();
    const shops = (await sql`
      SELECT id, is_trending, growth_weight FROM shops
    `) as Array<{
      id: string;
      is_trending: boolean;
      growth_weight: number | string | null;
    }>;

    let grown = 0;
    for (const s of shops) {
      const weight = Number(s.growth_weight) || 1;
      const trend = s.is_trending ? 2 : 1;
      // Per-shop random so shops keep diverging; trending grows faster.
      const viewInc = Math.max(1, Math.round((5 + Math.random() * 22) * weight * trend));
      const likeInc = Math.round(viewInc * (0.05 + Math.random() * 0.12));

      await applyGrowthTick(sql, s.id, viewInc, likeInc);
      grown += 1;
    }
    return NextResponse.json({ ok: true, grown });
  } catch (err) {
    console.error("cron grow error:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
