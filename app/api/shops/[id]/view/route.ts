import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { isSameOrigin, isUuid } from "@/lib/request-guard";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/ip";

export const dynamic = "force-dynamic";

/** Increment a shop's view count (all-time + this-week) when its detail page
 *  mounts. Same-origin + per-IP rate limit; never stores a raw IP. */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "forbidden origin" },
      { status: 403 },
    );
  }

  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });
  }

  const ipHash = clientIpHash(request.headers);
  const rl = await rateLimit(`view:${ipHash}`, { limit: 60, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  if (!hasDb()) {
    return NextResponse.json(
      { ok: false, error: "database not configured" },
      { status: 503 },
    );
  }

  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM increment_shop_view(${id})`;
    const row = rows[0];
    return NextResponse.json({
      ok: true,
      view_count: row?.view_count ?? null,
      weekly_view_count: row?.weekly_view_count ?? null,
    });
  } catch (err) {
    console.error("view route exception:", (err as Error).message);
    return NextResponse.json(
      { ok: false, error: "request failed" },
      { status: 500 },
    );
  }
}
