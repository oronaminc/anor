/**
 * Shared helpers for the db:* scripts (db-push, db-seed).
 *
 * Kept dependency-free (only the Neon driver, already a prod dep) so the
 * scripts run with a plain `node` on Vercel and locally.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Absolute path within the repo. */
export function repoPath(...parts) {
  return join(root, ...parts);
}

/**
 * Load .env.local (if present) into process.env without overriding values that
 * are already set. Lets a plain `node scripts/*.mjs` pick up local config the
 * way `next` does; a no-op on Vercel (vars injected, no .env.local deployed).
 */
export function loadEnvLocal() {
  try {
    const text = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      if (val && process.env[m[1]] === undefined) process.env[m[1]] = val;
    }
  } catch {
    /* no .env.local — fine (CI/Vercel) */
  }
}

/** A real DATABASE_URL, or null when absent / still a placeholder. */
export function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("your-") || url.includes("placeholder")) return null;
  return url;
}

/**
 * Split a .sql file into individual statements. A small tokenizer so a `;`
 * only terminates a statement when it is truly at top level — never inside a
 * single-quoted string (with `''` escapes), a `$$ ... $$` body, or a `--` /
 * `/* *\/` comment. (Our seed data has Spanish text containing semicolons.)
 */
export function splitStatements(sql) {
  const statements = [];
  let current = "";
  let state = "normal"; // normal | single | dollar | line | block
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    const two = sql.slice(i, i + 2);

    if (state === "normal") {
      if (two === "--") { state = "line"; i += 2; continue; }
      if (two === "/*") { state = "block"; i += 2; continue; }
      if (two === "$$") { state = "dollar"; current += two; i += 2; continue; }
      if (ch === "'") { state = "single"; current += ch; i += 1; continue; }
      if (ch === ";") {
        if (current.trim()) statements.push(current.trim());
        current = "";
        i += 1;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }
    if (state === "line") {
      if (ch === "\n") { state = "normal"; current += "\n"; }
      i += 1;
      continue;
    }
    if (state === "block") {
      if (two === "*/") { state = "normal"; i += 2; continue; }
      i += 1;
      continue;
    }
    if (state === "dollar") {
      if (two === "$$") { state = "normal"; current += two; i += 2; continue; }
      current += ch;
      i += 1;
      continue;
    }
    // state === "single"
    if (two === "''") { current += two; i += 2; continue; } // escaped quote
    if (ch === "'") { state = "normal"; current += ch; i += 1; continue; }
    current += ch;
    i += 1;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

export { neon };
