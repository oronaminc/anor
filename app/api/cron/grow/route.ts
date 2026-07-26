import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { growAllShops } from "@/lib/boost";

export const dynamic = "force-dynamic";

/**
 * How many 5-minute ticks' worth of growth one call applies. The cron fires
 * HOURLY (.github/workflows/grow.yml) rather than every 5 minutes so the Neon
 * compute can auto-suspend in between — 12 × 5min = the same growth per hour.
 * Keep this in step with the workflow's schedule.
 */
const TICKS_PER_RUN = 12;

/**
 * Periodic "organic" growth — called hourly by the GitHub Actions cron
 * (.github/workflows/grow.yml). Adds a small RANDOM amount to each shop's
 * SYNTHETIC counts, persisted in the DB, so the displayed number (real +
 * synthetic) is always stable and consistent. Views grow faster than likes and
 * the like bump is capped so total likes can never reach total views.
 *
 * The whole table grows in ONE statement (`growAllShops`); doing it row by row
 * is what exhausted the database's compute quota.
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
    const grown = await growAllShops(getSql(), TICKS_PER_RUN);
    return NextResponse.json({ ok: true, grown });
  } catch (err) {
    const message = (err as Error).message;
    console.error("cron grow error:", message);
    // Surface the reason to the caller (the workflow log) — a quota/billing
    // stop reads as a generic failure otherwise, which is how the last outage
    // went unnoticed. This route is already behind CRON_SECRET.
    return NextResponse.json(
      { ok: false, error: "failed", detail: message },
      { status: 500 },
    );
  }
}
