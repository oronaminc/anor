/**
 * Stateless signed-cookie sessions, implemented with the Web Crypto API
 * (HMAC-SHA256) so the SAME code runs in the Edge middleware and in Node
 * server actions — no external dependency, no DB session table.
 *
 * Token format:  base64url(JSON payload) + "." + base64url(HMAC(body))
 */

export const ADMIN_COOKIE = "anor_admin";
/** Binds the in-progress login-code (2FA) step to the browser that started it. */
export const LOGIN_CHALLENGE_COOKIE = "anor_login";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function sessionSecret(): string {
  return process.env.SESSION_SECRET || "anor-dev-session-secret-change-me";
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const normalized = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export type SessionPayload = { role: string; exp: number };

export async function signSession(
  payload: SessionPayload,
  secret = sessionSecret(),
): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(body),
  );
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(
  token: string | undefined | null,
  secret = sessionSecret(),
): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromBase64Url(sig) as BufferSource,
      encoder.encode(body),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      decoder.decode(fromBase64Url(body)),
    ) as SessionPayload;
    if (typeof payload.exp === "number" && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
