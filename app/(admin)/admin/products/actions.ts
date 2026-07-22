"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { isAdmin } from "@/lib/auth";
import { uploadToR2, r2Configured, deleteFromR2 } from "@/lib/storage";
import { isRetailer } from "@/lib/retailers";
import type { ProductInput, FoodTranslations } from "@/lib/types";

type Sql = ReturnType<typeof getSql>;

export type ProductActionState = { error?: string; success?: string } | null;

function readProductForm(formData: FormData): ProductInput {
  const str = (key: string) => String(formData.get(key) ?? "").trim();
  const translations: FoodTranslations = {};
  const ja = str("description_ja");
  if (ja) translations.ja = ja;

  const retailer = str("retailer");
  return {
    retailer: isRetailer(retailer) ? retailer : "olive_young",
    name_ko: str("name_ko"),
    name_en: str("name_en") || null,
    name_ja: str("name_ja") || null,
    brand: str("brand") || null,
    category: str("category") || null,
    description: str("description") || null,
    translations,
    price_range: str("price_range") || null,
    thumbnail_url: str("thumbnail_url") || null,
    is_trending: formData.get("is_trending") === "on",
  };
}

async function resolveThumbnail(
  formData: FormData,
  fallbackUrl: string | null,
): Promise<string | null> {
  const file = formData.get("thumbnail_file") as File | null;
  if (file && file.size > 0) {
    if (!r2Configured()) {
      throw new Error(
        "이미지 업로드를 사용하려면 R2 환경변수를 설정하세요. (또는 이미지 URL을 직접 입력)",
      );
    }
    return uploadToR2(file);
  }
  return fallbackUrl;
}

/** Drop a replaced/removed product image from R2 once nothing references it. */
async function deleteImageIfUnused(sql: Sql, url: string | null): Promise<void> {
  if (!url) return;
  const used = await sql`SELECT 1 FROM products WHERE thumbnail_url = ${url} LIMIT 1`;
  if (used.length) return;
  try {
    await deleteFromR2(url);
  } catch (err) {
    console.error("R2 cleanup failed:", err);
  }
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  if (!(await isAdmin())) return { error: "로그인이 필요합니다." };
  if (!hasDb()) return { error: "DATABASE_URL이 설정되지 않았습니다." };

  const p = readProductForm(formData);
  if (!p.name_ko) return { error: "한글 이름은 필수입니다." };

  try {
    const sql = getSql();
    const thumbnail = await resolveThumbnail(formData, p.thumbnail_url);
    await sql`
      INSERT INTO products
        (retailer, name_ko, name_en, name_ja, brand, category, description,
         translations, price_range, thumbnail_url, is_trending)
      VALUES
        (${p.retailer}, ${p.name_ko}, ${p.name_en}, ${p.name_ja}, ${p.brand},
         ${p.category}, ${p.description}, ${JSON.stringify(p.translations)}::jsonb,
         ${p.price_range}, ${thumbnail}, ${p.is_trending})
    `;
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/beauty");
  revalidatePath("/daiso");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  if (!(await isAdmin())) return { error: "로그인이 필요합니다." };
  if (!hasDb()) return { error: "DATABASE_URL이 설정되지 않았습니다." };

  const p = readProductForm(formData);
  if (!p.name_ko) return { error: "한글 이름은 필수입니다." };

  try {
    const sql = getSql();
    const prev = await sql`SELECT thumbnail_url FROM products WHERE id = ${id}`;
    const oldThumb = (prev[0]?.thumbnail_url as string | null) ?? null;
    const thumbnail = await resolveThumbnail(formData, p.thumbnail_url);
    await sql`
      UPDATE products SET
        retailer = ${p.retailer},
        name_ko = ${p.name_ko},
        name_en = ${p.name_en},
        name_ja = ${p.name_ja},
        brand = ${p.brand},
        category = ${p.category},
        description = ${p.description},
        translations = ${JSON.stringify(p.translations)}::jsonb,
        price_range = ${p.price_range},
        thumbnail_url = ${thumbnail},
        is_trending = ${p.is_trending}
      WHERE id = ${id}
    `;
    if (oldThumb && oldThumb !== thumbnail) await deleteImageIfUnused(sql, oldThumb);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/beauty");
  revalidatePath("/daiso");
  revalidatePath(`/product/${id}`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  if (!(await isAdmin())) return;
  if (!hasDb()) return;
  const sql = getSql();
  const rows = await sql`SELECT thumbnail_url FROM products WHERE id = ${id}`;
  const url = (rows[0]?.thumbnail_url as string | null) ?? null;
  await sql`DELETE FROM products WHERE id = ${id}`;
  await deleteImageIfUnused(sql, url);
  revalidatePath("/admin/products");
  revalidatePath("/beauty");
  revalidatePath("/daiso");
}

export async function toggleProductTrending(id: string, next: boolean) {
  if (!(await isAdmin())) return;
  if (!hasDb()) return;
  await getSql()`UPDATE products SET is_trending = ${next} WHERE id = ${id}`;
  revalidatePath("/admin/products");
  revalidatePath("/beauty");
  revalidatePath("/daiso");
}

/** Manually bump a product's views/likes by +1,000 (keeps views > likes). */
export async function boostProduct(id: string, kind: "view" | "like") {
  if (!(await isAdmin())) return;
  if (!hasDb()) return;
  const sql = getSql();
  if (kind === "view") {
    await sql`UPDATE products SET synthetic_view_count = synthetic_view_count + 1000 WHERE id = ${id}`;
  } else {
    await sql`
      UPDATE products SET
        synthetic_like_count = synthetic_like_count + 1000,
        synthetic_view_count = synthetic_view_count + greatest(
          0,
          (like_count + synthetic_like_count + 1000)
            - (view_count + synthetic_view_count) + 1
        )
      WHERE id = ${id}
    `;
  }
  revalidatePath("/admin/products");
  revalidatePath("/beauty");
  revalidatePath("/daiso");
  revalidatePath(`/product/${id}`);
}
