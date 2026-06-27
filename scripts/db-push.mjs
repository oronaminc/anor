#!/usr/bin/env node
/**
 * Idempotently apply db/schema.sql to the database in DATABASE_URL.
 *
 * Goal: nobody pastes SQL into the Neon console by hand. This runs
 * automatically before `next build` (see package.json "build"), so every
 * Vercel deploy keeps the schema in sync, and it can also be run on demand:
 *
 *   npm run db:push
 *
 * The whole schema is written with `create table if not exists`,
 * `create index if not exists`, `create or replace function` and (for new
 * columns) `alter table ... add column if not exists`, so re-applying it is
 * always safe and additive. Destructive changes (drop/rename) are NOT handled
 * here — those need a deliberate one-off migration.
 *
 * No-ops cleanly when DATABASE_URL is absent or still a placeholder (CI, demo,
 * or local UI-only work), so it never breaks a build that has no database.
 */
import { readFileSync } from "node:fs";
import {
  loadEnvLocal,
  databaseUrl,
  splitStatements,
  repoPath,
  neon,
} from "./lib.mjs";

loadEnvLocal();
const url = databaseUrl();
if (!url) {
  console.log("[db:push] DATABASE_URL not set — skipping (demo/CI).");
  process.exit(0);
}

const statements = splitStatements(
  readFileSync(repoPath("db", "schema.sql"), "utf8"),
);
const sql = neon(url);

try {
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`[db:push] schema applied — ${statements.length} statements ✓`);
} catch (err) {
  console.error("[db:push] FAILED:", err?.message || err);
  process.exit(1);
}
