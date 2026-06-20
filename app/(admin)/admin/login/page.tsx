"use client";

import { useFormState, useFormStatus } from "react-dom";

import { login, type ActionState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? "로그인 중..." : "로그인"}
    </Button>
  );
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(login, null);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <p className="text-3xl">🍢</p>
          <h1 className="text-xl font-extrabold">관리자 로그인</h1>
          <p className="text-sm text-muted-foreground">
            명동 길거리 음식 가이드 관리
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input
            type="hidden"
            name="redirect"
            value={searchParams.redirect ?? "/admin"}
          />
          <div className="space-y-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
