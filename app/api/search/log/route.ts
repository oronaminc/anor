import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { isSameOrigin } from "@/lib/request-guard";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/ip";
import { normalizeQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

/**
 * Record a search query for the admin analytics dashboard. Fire-and-forget
 * from the client (debounced). Same-origin + per-IP rate limited; the raw IP
 * is never stored (sha256(ip + salt) only).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body: { q?: unknown; locale?: unknown; results?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad body" }, { status: 400 });
  }

  const q = typeof body.q === "string" ? body.q.slice(0, 200) : "";
  const normalized = normalizeQuery(q);
  if (!normalized) return NextResponse.json({ ok: true, skipped: true });

  const locale =
    typeof body.locale === "string" ? body.locale.slice(0, 8) : null;
  const results =
    body.results != null && Number.isFinite(Number(body.results))
      ? Math.trunc(Number(body.results))
      : null;

  const ipHash = clientIpHash(request.headers);
  const rl = await rateLimit(`search:${ipHash}`, {
    limit: 40,
    windowMs: 60_000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { ok: false, error: "rate limited" },
      { status: 429 },
    );
  }

  if (!hasDb()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  try {
    const sql = getSql();
    await sql`SELECT log_search(${q}, ${normalized}, ${locale}, ${results}, ${ipHash})`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("search log route exception:", (err as Error).message);
    return NextResponse.json(
      { ok: false, error: "request failed" },
      { status: 500 },
    );
  }
}
