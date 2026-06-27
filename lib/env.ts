/**
 * True when a Neon (or any Postgres) database is configured via DATABASE_URL.
 * When false, public pages fall back to the demo dataset and the write APIs
 * (likes / view / search-log) no-op, so a zero-config preview/dev still works.
 *
 * Server-side only signal (DATABASE_URL is not a NEXT_PUBLIC var), but this
 * helper is safe to import anywhere — it just reads process.env.
 */
export function hasDb(): boolean {
  const url = process.env.DATABASE_URL;
  return !!url && !url.includes("your-") && !url.includes("placeholder");
}
