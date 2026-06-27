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
 * Split a .sql file into individual statements: strip whole-line `--` comments,
 * then split on `;` while ignoring semicolons inside `$$ ... $$` (plpgsql
 * function bodies).
 */
export function splitStatements(sql) {
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

export { neon };
