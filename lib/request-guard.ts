import "server-only";

/**
 * Collect the set of hostnames we treat as "us": the request's own Host (and
 * forwarded host), plus NEXT_PUBLIC_SITE_URL and any comma-separated
 * ALLOWED_ORIGINS. Hostnames include the port when present.
 */
function allowedHosts(request: Request): Set<string> {
  const hosts = new Set<string>();

  const host = request.headers.get("host");
  if (host) hosts.add(host.toLowerCase());
  const fwd = request.headers.get("x-forwarded-host");
  if (fwd) hosts.add(fwd.toLowerCase());

  const envOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(",") ?? []),
  ];
  for (const entry of envOrigins) {
    const value = entry?.trim();
    if (!value) continue;
    try {
      hosts.add(new URL(value).host.toLowerCase());
    } catch {
      hosts.add(value.toLowerCase());
    }
  }
  return hosts;
}

/**
 * Same-origin guard for mutating API routes (likes, view bumps, search logs).
 *
 * Browsers attach an `Origin` header to cross-origin POSTs (and to same-origin
 * POSTs), so a request whose Origin/Referer host is NOT one of ours means some
 * other website's JavaScript is calling our API — we reject it. This is our
 * lightweight CORS / anti-hotlinking defense.
 *
 * Requests with neither Origin nor Referer (curl, server-to-server, some native
 * apps) are allowed through here but remain subject to rate limiting and the
 * per-IP dedupe, so they still can't inflate counters.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate a path param is a UUID before it reaches Postgres (avoids leaking
 *  "invalid input syntax for type uuid" errors to anonymous callers). */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isSameOrigin(request: Request): boolean {
  const source =
    request.headers.get("origin") || request.headers.get("referer");
  if (!source) return true;

  let sourceHost: string;
  try {
    sourceHost = new URL(source).host.toLowerCase();
  } catch {
    return false;
  }

  return allowedHosts(request).has(sourceHost);
}
