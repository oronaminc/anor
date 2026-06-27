import "server-only";

import { getSql } from "./db";
import { sessionSecret } from "./session";

/**
 * One-time-code (OTP) store for admin login 2FA over Telegram.
 *
 * Flow: a correct password creates a challenge (6-digit code → DB stores only
 * its hash), the code is sent to the admin's Telegram, and a session is granted
 * only once the matching code is submitted. Rows are single-use (deleted on
 * success) and capped at MAX_CODE_ATTEMPTS, so a 6-digit code is not
 * brute-forceable even by someone who already knows the password. State lives
 * in Neon (not memory) so it works across serverless instances.
 */
export const CODE_TTL_SECONDS = 5 * 60;
export const MAX_CODE_ATTEMPTS = 5;

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/** A uniformly-random 6-digit code (rejection sampling avoids modulo bias). */
export function generateCode(): string {
  const range = 1_000_000;
  const limit = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  let n: number;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return String(n % range).padStart(6, "0");
}

/** Hash a code with the server secret so the DB never holds a usable code. */
export function hashCode(code: string): Promise<string> {
  return sha256Hex(`${sessionSecret()}:${code}`);
}

/** Length-safe, branch-free equality for two equal-length hex digests. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Insert a new challenge, GC expired rows, and return its id. */
export async function createChallenge(opts: {
  code: string;
  redirectTo: string;
  ipHash: string;
}): Promise<string> {
  const sql = getSql();
  const codeHash = await hashCode(opts.code);
  await sql`DELETE FROM login_challenges WHERE expires_at < now()`;
  const [row] = await sql`
    INSERT INTO login_challenges (code_hash, redirect_to, ip_hash, expires_at)
    VALUES (
      ${codeHash}, ${opts.redirectTo}, ${opts.ipHash},
      now() + make_interval(secs => ${CODE_TTL_SECONDS})
    )
    RETURNING id
  `;
  return row.id as string;
}

export async function deleteChallenge(id: string): Promise<void> {
  await getSql()`DELETE FROM login_challenges WHERE id = ${id}`;
}

export type VerifyResult =
  | { ok: true; redirectTo: string }
  | { ok: false; reason: "invalid" | "expired" | "locked" | "not_found" };

/**
 * Atomically count an attempt and check the submitted code. The attempt counter
 * is bumped in a single UPDATE so concurrent guesses can't slip past the cap.
 * Consumes the row on success, on expiry, and on hitting the attempt cap.
 */
export async function verifyChallenge(
  id: string,
  code: string,
): Promise<VerifyResult> {
  const sql = getSql();
  const [row] = await sql`
    UPDATE login_challenges
       SET attempts = attempts + 1
     WHERE id = ${id}
    RETURNING code_hash, redirect_to, attempts, (expires_at < now()) AS expired
  `;
  if (!row) return { ok: false, reason: "not_found" };

  if (row.expired) {
    await deleteChallenge(id);
    return { ok: false, reason: "expired" };
  }

  const codeHash = await hashCode(code);
  if (constantTimeEqual(codeHash, row.code_hash as string)) {
    await deleteChallenge(id);
    return { ok: true, redirectTo: (row.redirect_to as string) || "/admin" };
  }

  if ((row.attempts as number) >= MAX_CODE_ATTEMPTS) {
    await deleteChallenge(id);
    return { ok: false, reason: "locked" };
  }
  return { ok: false, reason: "invalid" };
}
