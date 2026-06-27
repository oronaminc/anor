"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import {
  verifyPassword,
  createSession,
  destroySession,
  isAdmin,
} from "@/lib/auth";
import { clientIpHash } from "@/lib/ip";
import { rateLimit } from "@/lib/rate-limit";
import { LOGIN_CHALLENGE_COOKIE } from "@/lib/session";
import { telegramConfigured, sendTelegramMessage } from "@/lib/telegram";
import {
  createChallenge,
  deleteChallenge,
  verifyChallenge,
  generateCode,
  CODE_TTL_SECONDS,
} from "@/lib/login-challenge";
import { uploadToR2, r2Configured } from "@/lib/storage";
import type { FoodInput } from "@/lib/types";

export type ActionState = {
  error?: string;
  success?: string;
  /** Present when the password was accepted and a Telegram code is awaited. */
  stage?: "code";
  info?: string;
} | null;

// Only ever redirect to an in-app /admin path (never an attacker-supplied URL).
function safeRedirect(target: string): string {
  return target.startsWith("/admin") ? target : "/admin";
}

// ---------------------------------------------------------------------
// Auth (password + signed cookie, optional Telegram one-time code)
//
// A single action drives a two-step form so there is exactly one piece of
// form state to reason about. Step 1 is the password; when TELEGRAM_* and a
// database are configured a correct password does NOT grant a session — it
// issues a 6-digit code over Telegram and returns { stage: "code" }. Step 2
// (the same action, now with a challenge cookie + step=code) confirms the
// code and grants the session. Without Telegram/DB, login stays password-only
// so local/demo still works. Both steps are rate-limited per IP.
// ---------------------------------------------------------------------
export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ipHash = clientIpHash(headers());
  const challengeId = cookies().get(LOGIN_CHALLENGE_COOKIE)?.value;

  // ----- Step 2: confirm the Telegram one-time code -----
  if (challengeId && String(formData.get("step")) === "code") {
    const limit = await rateLimit(`admin-code:${ipHash}`, {
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.success) {
      cookies().delete(LOGIN_CHALLENGE_COOKIE);
      return { error: "시도가 너무 많습니다. 잠시 후 다시 로그인해 주세요." };
    }

    const code = String(formData.get("code") ?? "").trim();
    if (!/^\d{6}$/.test(code)) {
      return { stage: "code", error: "6자리 숫자 코드를 입력해 주세요." };
    }

    const result = await verifyChallenge(challengeId, code);
    if (!result.ok) {
      if (result.reason === "invalid") {
        return { stage: "code", error: "코드가 올바르지 않습니다. 다시 입력해 주세요." };
      }
      cookies().delete(LOGIN_CHALLENGE_COOKIE);
      return {
        error:
          result.reason === "locked"
            ? "코드 입력 횟수를 초과했습니다. 다시 로그인해 주세요."
            : "코드가 만료되었습니다. 다시 로그인해 주세요.",
      };
    }

    cookies().delete(LOGIN_CHALLENGE_COOKIE);
    await createSession();
    redirect(result.redirectTo);
  }

  // ----- Step 1: password -----
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(String(formData.get("redirect") ?? "/admin"));

  if (!password) {
    return { error: "비밀번호를 입력해 주세요." };
  }

  const limit = await rateLimit(`admin-login:${ipHash}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.success) {
    return { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." };
  }

  if (!(await verifyPassword(password))) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  // Two-factor: deliver a one-time code over Telegram before granting access.
  if (telegramConfigured() && hasDb()) {
    const code = generateCode();
    let id: string;
    try {
      id = await createChallenge({ code, redirectTo, ipHash });
    } catch {
      return { error: "로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
    }
    try {
      await sendTelegramMessage(
        `🔐 anor 관리자 로그인 코드\n\n${code}\n\n` +
          `${Math.round(CODE_TTL_SECONDS / 60)}분 안에 입력하세요. ` +
          `본인이 요청한 게 아니라면 무시하세요.`,
      );
    } catch {
      await deleteChallenge(id);
      return { error: "인증 코드 전송에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }

    cookies().set(LOGIN_CHALLENGE_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/admin",
      maxAge: CODE_TTL_SECONDS,
    });
    return { stage: "code", info: "텔레그램으로 보낸 6자리 코드를 입력하세요." };
  }

  await createSession();
  redirect(redirectTo);
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function parseHashtags(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
}

function readFoodForm(formData: FormData): {
  fields: Omit<FoodInput, "hashtags">;
  hashtags: string[];
} {
  const num = (v: FormDataEntryValue | null) => {
    const n = parseFloat(String(v ?? ""));
    return Number.isFinite(n) ? n : null;
  };
  const str = (key: string) => String(formData.get(key) ?? "").trim();

  const translations: Record<string, string> = {};
  for (const loc of ["en", "ja", "es"] as const) {
    const value = str(`description_${loc}`);
    if (value) translations[loc] = value;
  }

  return {
    fields: {
      name_ko: str("name_ko"),
      name_en: str("name_en") || null,
      name_ja: str("name_ja") || null,
      name_es: str("name_es") || null,
      description: str("description") || null,
      translations,
      category: str("category") || null,
      lat: num(formData.get("lat")),
      lng: num(formData.get("lng")),
      address: str("address") || null,
      youtube_shorts_url: str("youtube_shorts_url") || null,
      thumbnail_url: str("thumbnail_url") || null,
      price_range: str("price_range") || null,
      is_trending: formData.get("is_trending") === "on",
    },
    hashtags: parseHashtags(str("hashtags")),
  };
}

/** Resolve the thumbnail URL: upload to R2 when a file is provided, else use
 *  the pasted URL. Returns the URL string (or null). */
async function resolveThumbnail(
  formData: FormData,
  fallbackUrl: string | null,
): Promise<string | null> {
  const file = formData.get("thumbnail_file") as File | null;
  if (file && file.size > 0) {
    if (!r2Configured()) {
      throw new Error(
        "이미지 업로드를 사용하려면 R2 환경변수를 설정하세요. (또는 썸네일 URL을 직접 입력)",
      );
    }
    return uploadToR2(file);
  }
  return fallbackUrl;
}

// ---------------------------------------------------------------------
// CRUD (Neon SQL)
// ---------------------------------------------------------------------
export async function createFood(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await isAdmin())) return { error: "로그인이 필요합니다." };
  if (!hasDb()) return { error: "DATABASE_URL이 설정되지 않았습니다." };

  const sql = getSql();
  const { fields, hashtags } = readFoodForm(formData);
  if (!fields.name_ko) return { error: "한글 이름은 필수입니다." };

  try {
    const thumbnail = await resolveThumbnail(formData, fields.thumbnail_url);
    await sql`
      INSERT INTO foods
        (name_ko, name_en, name_ja, name_es, description, translations,
         category, lat, lng, address, youtube_shorts_url, thumbnail_url,
         price_range, is_trending, hashtags)
      VALUES
        (${fields.name_ko}, ${fields.name_en}, ${fields.name_ja},
         ${fields.name_es}, ${fields.description},
         ${JSON.stringify(fields.translations)}::jsonb,
         ${fields.category}, ${fields.lat}, ${fields.lng}, ${fields.address},
         ${fields.youtube_shorts_url}, ${thumbnail}, ${fields.price_range},
         ${fields.is_trending}, ${hashtags})
    `;
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function updateFood(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await isAdmin())) return { error: "로그인이 필요합니다." };
  if (!hasDb()) return { error: "DATABASE_URL이 설정되지 않았습니다." };

  const sql = getSql();
  const { fields, hashtags } = readFoodForm(formData);
  if (!fields.name_ko) return { error: "한글 이름은 필수입니다." };

  try {
    const thumbnail = await resolveThumbnail(formData, fields.thumbnail_url);
    await sql`
      UPDATE foods SET
        name_ko = ${fields.name_ko},
        name_en = ${fields.name_en},
        name_ja = ${fields.name_ja},
        name_es = ${fields.name_es},
        description = ${fields.description},
        translations = ${JSON.stringify(fields.translations)}::jsonb,
        category = ${fields.category},
        lat = ${fields.lat},
        lng = ${fields.lng},
        address = ${fields.address},
        youtube_shorts_url = ${fields.youtube_shorts_url},
        thumbnail_url = ${thumbnail},
        price_range = ${fields.price_range},
        is_trending = ${fields.is_trending},
        hashtags = ${hashtags}
      WHERE id = ${id}
    `;
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/food/${id}`);
  redirect("/admin");
}

export async function deleteFood(id: string) {
  if (!(await isAdmin())) return;
  if (!hasDb()) return;
  await getSql()`DELETE FROM foods WHERE id = ${id}`;
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleTrending(id: string, next: boolean) {
  if (!(await isAdmin())) return;
  if (!hasDb()) return;
  await getSql()`UPDATE foods SET is_trending = ${next} WHERE id = ${id}`;
  revalidatePath("/admin");
  revalidatePath("/");
}
