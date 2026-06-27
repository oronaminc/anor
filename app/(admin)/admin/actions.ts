"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import {
  verifyPassword,
  createSession,
  destroySession,
  isAdmin,
} from "@/lib/auth";
import { uploadToR2, r2Configured } from "@/lib/storage";
import type { FoodInput } from "@/lib/types";

export type ActionState = { error?: string; success?: string } | null;

// ---------------------------------------------------------------------
// Auth (password + signed cookie)
// ---------------------------------------------------------------------
export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin");

  if (!password) {
    return { error: "비밀번호를 입력해 주세요." };
  }

  if (!(await verifyPassword(password))) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  await createSession();
  redirect(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
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
