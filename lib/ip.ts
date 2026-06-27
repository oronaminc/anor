import "server-only";
import { createHash } from "crypto";

/**
 * Best-effort client IP from proxy headers.
 *
 * We deliberately prefer the platform-set, non-forgeable headers
 * (`cf-connecting-ip` on Cloudflare, `x-real-ip` on Vercel/most hosts) over the
 * leftmost `x-forwarded-for` entry. The leftmost XFF value is the LEAST
 * trustworthy — behind an appending proxy a client can inject it — and since
 * this IP keys both the per-IP rate limit and the one-like-per-IP dedupe, a
 * spoofable value would let an attacker mint a fresh identity per request.
 *
 * Returns "unknown" when nothing is available (local dev), which still produces
 * a stable hash so dedupe works in that environment.
 */
export function getClientIp(headers: Headers): string {
  const trusted =
    headers.get("cf-connecting-ip")?.trim() || headers.get("x-real-ip")?.trim();
  if (trusted) return trusted;

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

const DEFAULT_SALT = "anor-dev-salt-change-me";
let warnedDefaultSalt = false;

/**
 * One-way hash of an IP so we can dedupe (one like per IP) and key rate limits
 * WITHOUT ever storing a raw IP address. The salt is server-only; rotating it
 * resets all stored like/dedupe state. Shipping the default salt in production
 * would make the small IPv4 space brute-forceable, so we warn loudly.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt && process.env.NODE_ENV === "production" && !warnedDefaultSalt) {
    warnedDefaultSalt = true;
    console.warn(
      "[anor] IP_HASH_SALT is not set in production — using an insecure default. " +
        "Set IP_HASH_SALT to a long random secret.",
    );
  }
  return createHash("sha256")
    .update(`${salt || DEFAULT_SALT}:${ip}`)
    .digest("hex");
}

/** Convenience: hashed IP straight from a request's headers. */
export function clientIpHash(headers: Headers): string {
  return hashIp(getClientIp(headers));
}
