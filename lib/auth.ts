import "server-only";
import { cookies } from "next/headers";

import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/** True when an admin password (or its hash) is configured. */
export function adminConfigured(): boolean {
  return !!(process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH);
}

/**
 * Constant-time-ish check of a submitted password against ADMIN_PASSWORD
 * (plaintext secret) or ADMIN_PASSWORD_HASH (sha256 hex). Compares fixed-length
 * hashes to avoid leaking length/early-exit timing.
 */
export async function verifyPassword(input: string): Promise<boolean> {
  if (!input) return false;
  const configuredHash = process.env.ADMIN_PASSWORD_HASH?.trim().toLowerCase();
  const plain = process.env.ADMIN_PASSWORD;
  const expected = configuredHash || (plain ? await sha256Hex(plain) : null);
  if (!expected) return false; // not configured → login disabled

  const got = await sha256Hex(input);
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) {
    diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSession(): Promise<void> {
  const token = await signSession({
    role: "admin",
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  });
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  cookies().delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return verifySession(token);
}

export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return !!session && session.role === "admin";
}
