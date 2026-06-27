#!/usr/bin/env node
/**
 * Seed (or clear) the sample dataset — the same Myeongdong foods that show in
 * demo mode when there's no database. Useful to fill a fresh DB so the app /
 * admin have something to work with.
 *
 *   npm run db:seed          # insert the demo foods (idempotent)
 *   npm run db:seed:clear     # remove ONLY the demo foods
 *
 * Demo rows are identified by their thumbnail_url (`/demo/*.svg`), which real
 * admin-created foods never have — so seeding never duplicates and clearing
 * never touches your real data.
 *
 * Source: a gitignored `db/seed.local.sql` if present (your private test data),
 * else the committed `db/seed.sql`. No-ops without a DATABASE_URL.
 */
import { readFileSync, existsSync } from "node:fs";
import {
  loadEnvLocal,
  databaseUrl,
  splitStatements,
  repoPath,
  neon,
} from "./lib.mjs";

const DEMO_LIKE = "/demo/%"; // thumbnail_url marker for sample rows

loadEnvLocal();
const url = databaseUrl();
if (!url) {
  console.log("[db:seed] DATABASE_URL not set — skipping.");
  process.exit(0);
}

const sql = neon(url);
const clear = process.argv.includes("--clear");

try {
  if (clear) {
    const removed = await sql.query(
      "delete from public.foods where thumbnail_url like $1 returning id",
      [DEMO_LIKE],
    );
    console.log(`[db:seed] removed ${removed.length} demo rows ✓`);
    process.exit(0);
  }

  // Idempotent: skip if demo rows are already present.
  const present = await sql.query(
    "select count(*)::int as n from public.foods where thumbnail_url like $1",
    [DEMO_LIKE],
  );
  const n = present[0]?.n ?? 0;
  if (n > 0) {
    console.log(
      `[db:seed] ${n} demo rows already present — nothing to add. ` +
        `(use \`npm run db:seed:clear\` to remove them)`,
    );
    process.exit(0);
  }

  const localSeed = repoPath("db", "seed.local.sql");
  const seedPath = existsSync(localSeed) ? localSeed : repoPath("db", "seed.sql");
  const statements = splitStatements(readFileSync(seedPath, "utf8"));
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(
    `[db:seed] inserted demo data from ${seedPath.split("/").pop()} ✓`,
  );
} catch (err) {
  console.error("[db:seed] FAILED:", err?.message || err);
  process.exit(1);
}
