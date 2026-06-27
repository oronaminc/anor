import "server-only";

/**
 * Pluggable fixed-window rate limiter.
 *
 *  - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses Upstash
 *    Redis over its REST API (shared across all serverless instances — the
 *    correct choice for production on Vercel/serverless). No extra npm
 *    dependency: we talk to the REST endpoint with fetch().
 *  - Otherwise falls back to an in-memory window (per server instance). That
 *    still blunts a single hammering connection in local/single-node deploys,
 *    but is best-effort across multiple instances — hence the Upstash path for
 *    real production. Both degrade open: a limiter error never blocks a request.
 */
export type RateLimitResult = {
  success: boolean;
  remaining: number;
  limit: number;
};

type Bucket = { count: number; resetAt: number };
const memBuckets = new Map<string, Bucket>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = memBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic GC so the map can't grow unbounded.
    if (memBuckets.size > 5000) {
      memBuckets.forEach((v, k) => {
        if (v.resetAt <= now) memBuckets.delete(k);
      });
    }
    return { success: true, remaining: limit - 1, limit };
  }

  existing.count += 1;
  return {
    success: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    limit,
  };
}

async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}`;

  // Pipeline: INCR the counter, then set the TTL only when the key is new
  // (EXPIRE ... NX), giving a fixed window that auto-resets.
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(windowSec), "NX"],
    ]),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`upstash rate-limit HTTP ${res.status}`);
  const data = (await res.json()) as Array<{ result: number }>;
  const count = Number(data[0]?.result ?? 0);
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    limit,
  };
}

export async function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const { limit, windowMs } = opts;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      return await upstashLimit(key, limit, windowMs);
    } catch {
      // Degrade to the in-memory limiter rather than failing the request.
    }
  }
  return memoryLimit(key, limit, windowMs);
}

/** Test-only: reset the in-memory window store. */
export function __resetMemoryBuckets() {
  memBuckets.clear();
}
