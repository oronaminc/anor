"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";

import type { Food } from "@/lib/types";
import type { ActionState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "저장 중..." : label}
    </Button>
  );
}

export function FoodForm({
  action,
  food,
  submitLabel,
}: {
  action: FormAction;
  food?: Food;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-5" encType="multipart/form-data">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="한글 이름 *" htmlFor="name_ko">
          <Input
            id="name_ko"
            name="name_ko"
            required
            defaultValue={food?.name_ko ?? ""}
            placeholder="떡볶이"
          />
        </Field>
        <Field label="영문 이름 (en)" htmlFor="name_en">
          <Input
            id="name_en"
            name="name_en"
            defaultValue={food?.name_en ?? ""}
            placeholder="Tteokbokki"
          />
        </Field>
        <Field label="일본어 이름 (ja)" htmlFor="name_ja">
          <Input
            id="name_ja"
            name="name_ja"
            defaultValue={food?.name_ja ?? ""}
            placeholder="トッポッキ"
          />
        </Field>
        <Field label="스페인어 이름 (es)" htmlFor="name_es">
          <Input
            id="name_es"
            name="name_es"
            defaultValue={food?.name_es ?? ""}
            placeholder="Tteokbokki"
          />
        </Field>
        <Field label="카테고리" htmlFor="category">
          <Input
            id="category"
            name="category"
            defaultValue={food?.category ?? ""}
            placeholder="분식 / 간식 / 꼬치 ..."
          />
        </Field>
        <Field label="가격대" htmlFor="price_range">
          <Input
            id="price_range"
            name="price_range"
            defaultValue={food?.price_range ?? ""}
            placeholder="₩3,000~5,000"
          />
        </Field>
      </div>

      <Field label="설명 (한국어 / 기본)" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={food?.description ?? ""}
          placeholder="음식에 대한 설명을 입력하세요."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="설명 (en)" htmlFor="description_en">
          <Textarea
            id="description_en"
            name="description_en"
            rows={3}
            defaultValue={food?.translations?.en ?? ""}
            placeholder="English description"
          />
        </Field>
        <Field label="설명 (ja)" htmlFor="description_ja">
          <Textarea
            id="description_ja"
            name="description_ja"
            rows={3}
            defaultValue={food?.translations?.ja ?? ""}
            placeholder="日本語の説明"
          />
        </Field>
        <Field label="설명 (es)" htmlFor="description_es">
          <Textarea
            id="description_es"
            name="description_es"
            rows={3}
            defaultValue={food?.translations?.es ?? ""}
            placeholder="Descripción en español"
          />
        </Field>
      </div>

      <Field label="해시태그 (쉼표 또는 공백 구분)" htmlFor="hashtags">
        <Input
          id="hashtags"
          name="hashtags"
          defaultValue={(food?.hashtags ?? []).join(", ")}
          placeholder="매콤, 분식, 명동맛집"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="위도 (lat)" htmlFor="lat">
          <Input
            id="lat"
            name="lat"
            type="number"
            step="any"
            defaultValue={food?.lat ?? ""}
            placeholder="37.5636"
          />
        </Field>
        <Field label="경도 (lng)" htmlFor="lng">
          <Input
            id="lng"
            name="lng"
            type="number"
            step="any"
            defaultValue={food?.lng ?? ""}
            placeholder="126.985"
          />
        </Field>
      </div>

      <Field label="주소" htmlFor="address">
        <Input
          id="address"
          name="address"
          defaultValue={food?.address ?? ""}
          placeholder="서울 중구 명동길 14"
        />
      </Field>

      <Field label="유튜브 쇼츠 URL" htmlFor="youtube_shorts_url">
        <Input
          id="youtube_shorts_url"
          name="youtube_shorts_url"
          type="url"
          defaultValue={food?.youtube_shorts_url ?? ""}
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
          type="url"
          defaultValue={food?.thumbnail_url ?? ""}
          placeholder="https://..."
        />
      </Field>

      <label className="flex items-center gap-2 rounded-lg border p-3">
        <input
          type="checkbox"
          name="is_trending"
          defaultChecked={food?.is_trending ?? false}
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
        <SubmitButton label={submitLabel} />
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
