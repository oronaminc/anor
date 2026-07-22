"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";

import type { Product } from "@/lib/types";
import {
  RETAILERS,
  RETAIL_CATEGORIES,
  RETAILER_CODES,
  type Retailer,
} from "@/lib/retailers";
import {
  createProduct,
  updateProduct,
  type ProductActionState,
} from "@/app/(admin)/admin/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "저장 중..." : label}
    </Button>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction] = useFormState<ProductActionState, FormData>(action, null);

  const [retailer, setRetailer] = useState<Retailer>(
    (product?.retailer as Retailer) ?? "olive_young",
  );
  const cats = RETAIL_CATEGORIES[retailer];

  return (
    <form action={formAction} className="space-y-5" encType="multipart/form-data">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="리테일러 *" htmlFor="retailer">
          <select
            id="retailer"
            name="retailer"
            value={retailer}
            onChange={(e) => setRetailer(e.target.value as Retailer)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {RETAILER_CODES.map((code) => (
              <option key={code} value={code}>
                {RETAILERS[code].ko} ({RETAILERS[code].ja})
              </option>
            ))}
          </select>
        </Field>
        <Field label="카테고리" htmlFor="category">
          <select
            id="category"
            name="category"
            defaultValue={product?.category ?? ""}
            key={retailer}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">(선택 안 함)</option>
            {cats.map((c) => (
              <option key={c.code} value={c.code}>
                {c.emoji} {c.ko} / {c.ja}
              </option>
            ))}
          </select>
        </Field>
        <Field label="브랜드" htmlFor="brand">
          <Input
            id="brand"
            name="brand"
            defaultValue={product?.brand ?? ""}
            placeholder="라운드랩"
          />
        </Field>
        <Field label="가격대 (₩)" htmlFor="price_range">
          <Input
            id="price_range"
            name="price_range"
            defaultValue={product?.price_range ?? ""}
            placeholder="₩16,000 (일본어는 ¥1,600 자동)"
          />
        </Field>
        <Field label="한글 이름 *" htmlFor="name_ko">
          <Input
            id="name_ko"
            name="name_ko"
            required
            defaultValue={product?.name_ko ?? ""}
            placeholder="라운드랩 1025 독도 토너"
          />
        </Field>
        <Field label="일본어 이름 (ja)" htmlFor="name_ja">
          <Input
            id="name_ja"
            name="name_ja"
            defaultValue={product?.name_ja ?? ""}
            placeholder="ラウンドラボ 1025 独島トナー"
          />
        </Field>
        <Field label="영문 이름 (en)" htmlFor="name_en">
          <Input
            id="name_en"
            name="name_en"
            defaultValue={product?.name_en ?? ""}
            placeholder="Round Lab 1025 Dokdo Toner"
          />
        </Field>
      </div>

      <Field label="설명 (한국어 / 기본)" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          placeholder="상품 설명"
        />
      </Field>
      <Field label="설명 (ja)" htmlFor="description_ja">
        <Textarea
          id="description_ja"
          name="description_ja"
          rows={3}
          defaultValue={product?.translations?.ja ?? ""}
          placeholder="日本語の説明"
        />
      </Field>

      <Field label="이미지 업로드" htmlFor="thumbnail_file">
        <Input
          id="thumbnail_file"
          name="thumbnail_file"
          type="file"
          accept="image/*"
          className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          업로드하지 않으면 아래 URL이 사용됩니다.
        </p>
      </Field>
      <Field label="이미지 URL (직접 입력)" htmlFor="thumbnail_url">
        <Input
          id="thumbnail_url"
          name="thumbnail_url"
          defaultValue={product?.thumbnail_url ?? ""}
          placeholder="https://... 또는 /products/xxx.svg"
        />
      </Field>

      <label className="flex items-center gap-2 rounded-lg border p-3">
        <input
          type="checkbox"
          name="is_trending"
          defaultChecked={product?.is_trending ?? false}
          className="size-4 accent-[hsl(var(--accent))]"
        />
        <span className="text-sm font-medium">급상승(트렌딩)으로 표시</span>
      </label>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton label={product ? "수정 저장" : "상품 추가"} />
        <Button asChild variant="outline" size="lg" type="button">
          <Link href="/admin/products">취소</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
