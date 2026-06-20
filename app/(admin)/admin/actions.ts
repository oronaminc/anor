"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { FoodInput } from "@/lib/types";

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "food-thumbnails";

export type ActionState = { error?: string; success?: string } | null;

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "로그인에 실패했습니다. 정보를 확인해 주세요." };
  }

  redirect(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
}

async function uploadThumbnail(
  supabase: Awaited<ReturnType<typeof requireUser>>,
  file: File,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
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

  // Localized descriptions -> translations JSONB keyed by locale.
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

// ---------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------
export async function createFood(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireUser();
  const { fields, hashtags } = readFoodForm(formData);

  if (!fields.name_ko) {
    return { error: "한글 이름은 필수입니다." };
  }

  try {
    const file = formData.get("thumbnail_file") as File | null;
    const uploaded = file ? await uploadThumbnail(supabase, file) : null;

    const { error } = await supabase.from("foods").insert({
      ...fields,
      thumbnail_url: uploaded ?? fields.thumbnail_url,
      hashtags,
    });

    if (error) return { error: error.message };
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
  const supabase = await requireUser();
  const { fields, hashtags } = readFoodForm(formData);

  if (!fields.name_ko) {
    return { error: "한글 이름은 필수입니다." };
  }

  try {
    const file = formData.get("thumbnail_file") as File | null;
    const uploaded =
      file && file.size > 0 ? await uploadThumbnail(supabase, file) : null;

    const { error } = await supabase
      .from("foods")
      .update({
        ...fields,
        thumbnail_url: uploaded ?? fields.thumbnail_url,
        hashtags,
      })
      .eq("id", id);

    if (error) return { error: error.message };
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/food/${id}`);
  redirect("/admin");
}

export async function deleteFood(id: string) {
  const supabase = await requireUser();
  await supabase.from("foods").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleTrending(id: string, next: boolean) {
  const supabase = await requireUser();
  await supabase.from("foods").update({ is_trending: next }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
}
