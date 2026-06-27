import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Lazily-created Neon SQL client (HTTP serverless driver). Usage:
 *
 *   const sql = getSql();
 *   const rows = await sql`SELECT * FROM foods WHERE id = ${id}`;
 *   const [row] = await sql`SELECT * FROM toggle_like(${id}, ${ipHash})`;
 *
 * Created lazily so the app still builds/runs with NO database configured
 * (demo mode) — callers must check hasDb() before calling getSql().
 */
let client: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!client) client = neon(url);
  return client;
}
