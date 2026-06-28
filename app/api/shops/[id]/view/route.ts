import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { isSameOrigin, isUuid } from "@/lib/request-guard";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/ip";

export const dynamic = "force-dynamic";

/** Increment a shop's view count by one when its detail page is opened.
 *  Same-origin + per-IP rate limit; returns the new stored view_count. */
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
    await sql`SELECT increment_shop_view(${id})`;
    // Return the fresh DISPLAY totals (real + synthetic) so the client can
    // reconcile away any stale server-rendered/cached number on mount.
    const rows = await sql`
      SELECT (view_count + synthetic_view_count) AS view_count,
             (like_count + synthetic_like_count) AS like_count
        FROM shops WHERE id = ${id}
    `;
    return NextResponse.json({
      ok: true,
      view_count: rows[0]?.view_count ?? null,
      like_count: rows[0]?.like_count ?? null,
    });
  } catch (err) {
    console.error("view route exception:", (err as Error).message);
    return NextResponse.json(
      { ok: false, error: "request failed" },
      { status: 500 },
    );
  }
}
