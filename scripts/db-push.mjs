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
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Load .env.local (if present) into process.env so a plain `npm run db:push`
 * works without exporting vars by hand — a standalone Node script doesn't read
 * .env.local the way `next` does. On Vercel the vars are already injected and
 * no .env.local is deployed, so this is a harmless no-op there.
 */
function loadEnvLocal() {
  try {
    const text = readFileSync(join(here, "..", ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      if (val && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* no .env.local — fine (CI/Vercel) */
  }
}

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url || url.includes("your-") || url.includes("placeholder")) {
  console.log("[db:push] DATABASE_URL not set — skipping (demo/CI).");
  process.exit(0);
}

const schemaPath = join(here, "..", "db", "schema.sql");
const raw = readFileSync(schemaPath, "utf8");

/**
 * Split a .sql file into individual statements. Whole-line `--` comments are
 * stripped first, then we split on `;` while ignoring semicolons inside
 * `$$ ... $$` blocks (our plpgsql function bodies).
 */
function splitStatements(sql) {
  const src = sql.replace(/^\s*--.*$/gm, "");
  const statements = [];
  let current = "";
  let inDollar = false;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "$" && src[i + 1] === "$") {
      inDollar = !inDollar;
      current += "$$";
      i++;
      continue;
    }
    const ch = src[i];
    if (ch === ";" && !inDollar) {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

const statements = splitStatements(raw);
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
