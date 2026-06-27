import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { isSameOrigin, isUuid } from "@/lib/request-guard";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/ip";

export const dynamic = "force-dynamic";

/**
 * Toggle an anonymous "like" for a shop. No login.
 *  1. Same-origin guard — only our own pages may call this.
 *  2. Per-IP rate limit — blocks bursts.
 *  3. Per-IP dedupe via UNIQUE(shop_id, ip_hash) in toggle_shop_like — one like
 *     per IP, second call un-likes. The raw IP is never stored.
 */
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
  const rl = await rateLimit(`like:${ipHash}`, { limit: 20, windowMs: 10_000 });
  if (!rl.success) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  if (!hasDb()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM toggle_shop_like(${id}, ${ipHash})`;
    const row = rows[0];
    return NextResponse.json({
      ok: true,
      liked: row?.liked ?? null,
      like_count: row?.like_count ?? null,
      weekly_like_count: row?.weekly_like_count ?? null,
    });
  } catch (err) {
    console.error("like route exception:", (err as Error).message);
    return NextResponse.json(
      { ok: false, error: "request failed" },
      { status: 500 },
    );
  }
}
