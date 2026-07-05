"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";

import type { ShopWithFoods } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import {
  createShop,
  updateShop,
  type ActionState,
} from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// A single editable menu-food row in the client-side menu editor. `key` is a
// stable React identity only — it is stripped before the array is serialized.
type MenuRow = {
  key: string;
  name_ko: string;
  name_en: string;
  name_ja: string;
  name_es: string;
  image_url: string;
  price_range: string;
  description: string;
};

function rowId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Math.random().toString(36).slice(2)}`;
}

function emptyRow(): MenuRow {
  return {
    key: rowId(),
    name_ko: "",
    name_en: "",
    name_ja: "",
    name_es: "",
    image_url: "",
    price_range: "",
    description: "",
  };
}

function rowsFromShop(shop?: ShopWithFoods): MenuRow[] {
  if (!shop?.foods?.length) return [emptyRow()];
  return shop.foods.map((f) => ({
    key: f.id,
    name_ko: f.name_ko ?? "",
    name_en: f.name_en ?? "",
    name_ja: f.name_ja ?? "",
    name_es: f.name_es ?? "",
    image_url: f.image_url ?? "",
    price_range: f.price_range ?? "",
    description: f.description ?? "",
  }));
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "저장 중..." : label}
    </Button>
  );
}

export function ShopForm({ shop }: { shop?: ShopWithFoods }) {
  const action = shop ? updateShop.bind(null, shop.id) : createShop;
  const [state, formAction] = useFormState<ActionState, FormData>(action, null);

  const [foods, setFoods] = useState<MenuRow[]>(() => rowsFromShop(shop));

  const updateRow = (key: string, patch: Partial<MenuRow>) =>
    setFoods((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  const addRow = () => setFoods((rows) => [...rows, emptyRow()]);
  const removeRow = (key: string) =>
    setFoods((rows) => {
      const next = rows.filter((r) => r.key !== key);
      return next.length ? next : [emptyRow()];
    });

  // Serialize the menu rows into the shape the server action expects. Empty
  // rows (no Korean name) are dropped so blank foods are never inserted.
  const serializedFoods = JSON.stringify(
    foods
      .map((r, i) => ({
        name_ko: r.name_ko.trim(),
        name_en: r.name_en.trim() || null,
        name_ja: r.name_ja.trim() || null,
        name_es: r.name_es.trim() || null,
        description: r.description.trim() || null,
        image_url: r.image_url.trim() || null,
        price_range: r.price_range.trim() || null,
        sort_order: i,
      }))
      .filter((f) => f.name_ko.length > 0),
  );

  return (
    <form action={formAction} className="space-y-5" encType="multipart/form-data">
      <input type="hidden" name="foods" value={serializedFoods} readOnly />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="한글 이름 *" htmlFor="name_ko">
          <Input
            id="name_ko"
            name="name_ko"
            required
            defaultValue={shop?.name_ko ?? ""}
            placeholder="고향만두"
          />
        </Field>
        <Field label="영문 이름 (en)" htmlFor="name_en">
          <Input
            id="name_en"
            name="name_en"
            defaultValue={shop?.name_en ?? ""}
            placeholder="Gohyang Mandu"
          />
        </Field>
        <Field label="일본어 이름 (ja)" htmlFor="name_ja">
          <Input
            id="name_ja"
            name="name_ja"
            defaultValue={shop?.name_ja ?? ""}
            placeholder="コヒャンマンドゥ"
          />
        </Field>
        <Field label="스페인어 이름 (es)" htmlFor="name_es">
          <Input
            id="name_es"
            name="name_es"
            defaultValue={shop?.name_es ?? ""}
            placeholder="Gohyang Mandu"
          />
        </Field>
        <Field label="가격대" htmlFor="price_range">
          <Input
            id="price_range"
            name="price_range"
            defaultValue={shop?.price_range ?? ""}
            placeholder="₩3,000~5,000"
          />
        </Field>
      </div>

      <Field label="설명 (한국어 / 기본)" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={shop?.description ?? ""}
          placeholder="가게에 대한 설명을 입력하세요."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="설명 (en)" htmlFor="description_en">
          <Textarea
            id="description_en"
            name="description_en"
            rows={3}
            defaultValue={shop?.translations?.en ?? ""}
            placeholder="English description"
          />
        </Field>
        <Field label="설명 (ja)" htmlFor="description_ja">
          <Textarea
            id="description_ja"
            name="description_ja"
            rows={3}
            defaultValue={shop?.translations?.ja ?? ""}
            placeholder="日本語の説明"
          />
        </Field>
        <Field label="설명 (es)" htmlFor="description_es">
          <Textarea
            id="description_es"
            name="description_es"
            rows={3}
            defaultValue={shop?.translations?.es ?? ""}
            placeholder="Descripción en español"
          />
        </Field>
      </div>

      <Field label="해시태그 (쉼표 또는 공백 구분)" htmlFor="hashtags">
        <Input
          id="hashtags"
          name="hashtags"
          defaultValue={(shop?.hashtags ?? []).join(", ")}
          placeholder="만두, 분식, 명동맛집"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="위도 (lat)" htmlFor="lat">
          <Input
            id="lat"
            name="lat"
            type="number"
            step="any"
            defaultValue={shop?.lat ?? ""}
            placeholder="37.5636"
          />
        </Field>
        <Field label="경도 (lng)" htmlFor="lng">
          <Input
            id="lng"
            name="lng"
            type="number"
            step="any"
            defaultValue={shop?.lng ?? ""}
            placeholder="126.985"
          />
        </Field>
      </div>

      <Field label="주소" htmlFor="address">
        <Input
          id="address"
          name="address"
          defaultValue={shop?.address ?? ""}
          placeholder="서울 중구 명동길 14"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="구역 (지역)" htmlFor="district">
          <Input
            id="district"
            name="district"
            defaultValue={shop?.district ?? ""}
            placeholder="명동거리"
          />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
          <input
            type="checkbox"
            name="line_pay"
            defaultChecked={shop?.line_pay ?? false}
            className="size-4 rounded border-border accent-[#06C755]"
          />
          LINE Pay 가능
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="certified"
            defaultChecked={shop?.certified ?? false}
            className="size-4 rounded border-border accent-[#2563eb]"
          />
          정식 인증 노점포
        </label>
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">
          카테고리 <span className="text-muted-foreground">(지도·필터용, 복수 선택)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <label
              key={c.code}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-foreground"
            >
              <input
                type="checkbox"
                name="categories"
                value={c.code}
                defaultChecked={shop?.categories?.includes(c.code) ?? false}
                className="sr-only"
              />
              {c.emoji} {c.ko}
            </label>
          ))}
        </div>
      </div>

      <Field label="유튜브 쇼츠 URL" htmlFor="youtube_shorts_url">
        <Input
          id="youtube_shorts_url"
          name="youtube_shorts_url"
          type="url"
          defaultValue={shop?.youtube_shorts_url ?? ""}
          placeholder="https://www.youtube.com/shorts/..."
        />
      </Field>

      <Field label="썸네일 이미지 업로드" htmlFor="thumbnail_file">
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

      <Field label="썸네일 URL (직접 입력)" htmlFor="thumbnail_url">
        <Input
          id="thumbnail_url"
          name="thumbnail_url"
          type="text"
          defaultValue={shop?.thumbnail_url ?? ""}
          placeholder="https://... 또는 /demo/lobster.svg"
        />
      </Field>

      <label className="flex items-center gap-2 rounded-lg border p-3">
        <input
          type="checkbox"
          name="is_trending"
          defaultChecked={shop?.is_trending ?? false}
          className="size-4 accent-[hsl(var(--accent))]"
        />
        <span className="text-sm font-medium">급상승(트렌딩)으로 표시</span>
      </label>

      {/* ---- Menu editor (가게 메뉴) ---- */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-semibold">메뉴 음식</legend>
        <p className="text-xs text-muted-foreground">
          이 가게에서 파는 음식들을 추가하세요. 한글 이름은 필수입니다.
        </p>

        <div className="space-y-4">
          {foods.map((row, i) => (
            <div key={row.key} className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  메뉴 {i + 1}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeRow(row.key)}
                >
                  삭제
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="한글 이름 *" htmlFor={`food_${row.key}_name_ko`}>
                  <Input
                    id={`food_${row.key}_name_ko`}
                    value={row.name_ko}
                    onChange={(e) =>
                      updateRow(row.key, { name_ko: e.target.value })
                    }
                    placeholder="김치만두"
                  />
                </Field>
                <Field label="영문 이름 (en)" htmlFor={`food_${row.key}_name_en`}>
                  <Input
                    id={`food_${row.key}_name_en`}
                    value={row.name_en}
                    onChange={(e) =>
                      updateRow(row.key, { name_en: e.target.value })
                    }
                    placeholder="Kimchi Mandu"
                  />
                </Field>
                <Field label="일본어 이름 (ja)" htmlFor={`food_${row.key}_name_ja`}>
                  <Input
                    id={`food_${row.key}_name_ja`}
                    value={row.name_ja}
                    onChange={(e) =>
                      updateRow(row.key, { name_ja: e.target.value })
                    }
                    placeholder="キムチ餃子"
                  />
                </Field>
                <Field label="스페인어 이름 (es)" htmlFor={`food_${row.key}_name_es`}>
                  <Input
                    id={`food_${row.key}_name_es`}
                    value={row.name_es}
                    onChange={(e) =>
                      updateRow(row.key, { name_es: e.target.value })
                    }
                    placeholder="Mandu de Kimchi"
                  />
                </Field>
                <Field label="가격대" htmlFor={`food_${row.key}_price_range`}>
                  <Input
                    id={`food_${row.key}_price_range`}
                    value={row.price_range}
                    onChange={(e) =>
                      updateRow(row.key, { price_range: e.target.value })
                    }
                    placeholder="₩4,000"
                  />
                </Field>
                <Field label="이미지 URL" htmlFor={`food_${row.key}_image_url`}>
                  <Input
                    id={`food_${row.key}_image_url`}
                    type="url"
                    value={row.image_url}
                    onChange={(e) =>
                      updateRow(row.key, { image_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </Field>
              </div>

              <Field label="설명" htmlFor={`food_${row.key}_description`}>
                <Textarea
                  id={`food_${row.key}_description`}
                  rows={2}
                  value={row.description}
                  onChange={(e) =>
                    updateRow(row.key, { description: e.target.value })
                  }
                  placeholder="메뉴에 대한 설명"
                />
              </Field>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          + 메뉴 추가
        </Button>
      </fieldset>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton label={shop ? "수정 저장" : "가게 추가"} />
        <Button asChild variant="outline" size="lg" type="button">
          <Link href="/admin">취소</Link>
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
