import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { rateLimit, __resetMemoryBuckets } from "@/lib/rate-limit";

// Ensure the in-memory limiter path is used (no Upstash env in tests).
const ORIG = { ...process.env };
beforeEach(() => {
  __resetMemoryBuckets();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});
afterEach(() => {
  process.env = { ...ORIG };
});

describe("rateLimit (in-memory window)", () => {
  it("allows up to the limit then blocks", async () => {
    const opts = { limit: 3, windowMs: 10_000 };
    const key = "test:a";
    expect((await rateLimit(key, opts)).success).toBe(true); // 1
    expect((await rateLimit(key, opts)).success).toBe(true); // 2
    expect((await rateLimit(key, opts)).success).toBe(true); // 3
    const blocked = await rateLimit(key, opts);
    expect(blocked.success).toBe(false); // 4 → over
    expect(blocked.remaining).toBe(0);
  });

  it("tracks keys independently", async () => {
    const opts = { limit: 1, windowMs: 10_000 };
    expect((await rateLimit("ip:1", opts)).success).toBe(true);
    expect((await rateLimit("ip:1", opts)).success).toBe(false);
    // Different key still has its full budget.
    expect((await rateLimit("ip:2", opts)).success).toBe(true);
  });

  it("resets after the window elapses", async () => {
    const opts = { limit: 1, windowMs: 20 };
    expect((await rateLimit("ip:w", opts)).success).toBe(true);
    expect((await rateLimit("ip:w", opts)).success).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    expect((await rateLimit("ip:w", opts)).success).toBe(true);
  });
});
