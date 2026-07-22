import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { isSameOrigin, isUuid } from "@/lib/request-guard";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/ip";

export const dynamic = "force-dynamic";

/** Read the fresh like total + whether THIS visitor (by IP) already liked. Used
 *  by ProductLikeButton on mount to reconcile away any stale cached number. */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });
  }
  if (!hasDb()) {
    return NextResponse.json({ ok: true, like_count: null, liked: null });
  }
  try {
    const sql = getSql();
    const ipHash = clientIpHash(request.headers);
    const rows = await sql`
      SELECT (s.like_count + s.synthetic_like_count) AS like_count,
             EXISTS (
               SELECT 1 FROM product_likes l
                WHERE l.product_id = s.id AND l.ip_hash = ${ipHash}
             ) AS liked
        FROM products s WHERE s.id = ${id}
    `;
    return NextResponse.json({
      ok: true,
      like_count: rows[0]?.like_count ?? null,
      liked: rows[0]?.liked ?? false,
    });
  } catch (err) {
    console.error("product like GET exception:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "request failed" }, { status: 500 });
  }
}

/** Toggle an anonymous "like" for a product. One like per IP (DB UNIQUE on
 *  product_likes); second call un-likes. Returns the DISPLAYED like total. */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "forbidden origin" }, { status: 403 });
  }
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });
  }

  const ipHash = clientIpHash(request.headers);
  const rl = await rateLimit(`plike:${ipHash}`, { limit: 20, windowMs: 10_000 });
  if (!rl.success) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  if (!hasDb()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM toggle_product_like(${id}, ${ipHash})`;
    const liked = rows[0]?.liked ?? null;
    const totals =
      await sql`SELECT (like_count + synthetic_like_count) AS total FROM products WHERE id = ${id}`;
    return NextResponse.json({ ok: true, liked, like_count: totals[0]?.total ?? null });
  } catch (err) {
    console.error("product like route exception:", (err as Error).message);
    return NextResponse.json({ ok: false, error: "request failed" }, { status: 500 });
  }
}
