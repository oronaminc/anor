#!/usr/bin/env node
/**
 * Load / stress test — measures how many concurrent requests the deployment
 * serves with healthy latency and success rate, i.e. roughly "how many people
 * at once" it can take. READ-ONLY (GET only) — it never mutates data or inflates
 * counts, and write endpoints are per-IP rate-limited by design anyway.
 *
 *   node scripts/stress.mjs [baseUrl] [path]
 *   npm run stress -- https://anor-sable.vercel.app /
 *
 * Env:
 *   STRESS_LEVELS=5,10,25,50,100,200   concurrency levels to ramp through
 *   STRESS_ROUNDS=3                     batches per level
 *   STRESS_P95_MS=2000                  p95 latency budget for "healthy"
 *
 * It ramps concurrency and prints req/s, success% and latency percentiles per
 * level, then the highest "healthy" concurrency (success ≥99.5%, p95 ≤ budget).
 */

const baseUrl = (
  process.argv[2] ||
  process.env.STRESS_URL ||
  "https://anor-sable.vercel.app"
).replace(/\/$/, "");
const path = process.argv[3] || "/";
const LEVELS = (process.env.STRESS_LEVELS || "5,10,25,50,100,200")
  .split(",")
  .map((n) => parseInt(n, 10))
  .filter(Boolean);
const ROUNDS = parseInt(process.env.STRESS_ROUNDS || "3", 10);
const P95_BUDGET = parseInt(process.env.STRESS_P95_MS || "2000", 10);

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

async function once(url, started) {
  const t0 = started();
  try {
    const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
    await res.arrayBuffer(); // drain the body so timing includes transfer
    return { ok: res.status < 400, status: res.status, ms: started() - t0 };
  } catch (err) {
    return { ok: false, status: 0, ms: started() - t0, err: String(err) };
  }
}

async function runLevel(concurrency, now) {
  const url = `${baseUrl}${path}`;
  const latencies = [];
  const statuses = {};
  let ok = 0;
  let total = 0;
  const wall0 = now();
  for (let r = 0; r < ROUNDS; r++) {
    const batch = await Promise.all(
      Array.from({ length: concurrency }, () => once(url, now)),
    );
    for (const b of batch) {
      total += 1;
      if (b.ok) ok += 1;
      latencies.push(b.ms);
      statuses[b.status] = (statuses[b.status] || 0) + 1;
    }
  }
  const wallSec = (now() - wall0) / 1000;
  latencies.sort((a, b) => a - b);
  return {
    concurrency,
    total,
    successPct: (ok / total) * 100,
    rps: total / wallSec,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    statuses,
  };
}

async function main() {
  const now = () => Number(process.hrtime.bigint() / 1000000n);
  console.log(
    `Stress target: ${baseUrl}${path}\n` +
      `Levels: [${LEVELS.join(", ")}]  rounds/level: ${ROUNDS}  p95 budget: ${P95_BUDGET}ms\n`,
  );
  console.log("conc |  reqs | succ% |   rps | p50ms | p95ms | p99ms | statuses");
  console.log("-----+-------+-------+-------+-------+-------+-------+---------");
  let healthy = 0;
  for (const c of LEVELS) {
    const r = await runLevel(c, now);
    const st = Object.entries(r.statuses)
      .map(([k, v]) => `${k}:${v}`)
      .join(" ");
    console.log(
      `${String(r.concurrency).padStart(4)} | ${String(r.total).padStart(5)} | ` +
        `${r.successPct.toFixed(1).padStart(5)} | ${r.rps.toFixed(1).padStart(5)} | ` +
        `${String(r.p50).padStart(5)} | ${String(r.p95).padStart(5)} | ${String(r.p99).padStart(5)} | ${st}`,
    );
    if (r.successPct >= 99.5 && r.p95 <= P95_BUDGET) healthy = c;
  }
  console.log(
    `\n➡  Healthy up to ~${healthy} concurrent requests ` +
      `(success ≥99.5%, p95 ≤ ${P95_BUDGET}ms).`,
  );
  console.log(
    "Notes: Vercel serverless auto-scales horizontally; the real ceiling is the\n" +
      "Neon connection budget + function concurrency, not app code. Write APIs\n" +
      "(view/like) are per-IP rate-limited, so capacity here is the read path.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
