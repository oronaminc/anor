/** How long a device stays "already counted" for one shop/product. */
const VIEW_WINDOW_MS = 6 * 60 * 60 * 1000;

/**
 * Record a detail-page view — at most once per device per 6 hours, and without
 * waiting for the answer.
 *
 * Every one of these is a database write, and the database is a serverless
 * Postgres billed by compute time whose compute only sleeps after ~5 idle
 * minutes: a trickle of views spread through the day is enough to keep it awake
 * permanently. Skipping repeat views and not reading anything back turns a
 * detail open from 3 queries into 1 — or into none at all for a returning
 * visitor.
 *
 * Returns whether this call actually counted, so the caller can show the +1
 * immediately instead of waiting for a round-trip.
 */
export function recordView(kind: "shops" | "products", id: string): boolean {
  const key = `anor:viewed:${kind}:${id}`;

  try {
    const last = Number(localStorage.getItem(key));
    if (Number.isFinite(last) && last > 0 && Date.now() - last < VIEW_WINDOW_MS) {
      return false;
    }
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // Private mode / storage disabled — count it, just without the dedupe.
  }

  // Fire-and-forget: the response is not needed, so nothing blocks paint and
  // the route can skip its read-back query entirely.
  fetch(`/api/${kind}/${id}/view`, { method: "POST", keepalive: true }).catch(
    () => {
      /* best-effort */
    },
  );
  return true;
}
