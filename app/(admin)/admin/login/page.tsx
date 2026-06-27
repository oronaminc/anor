"use client";

import { useFormState, useFormStatus } from "react-dom";

import { login, type ActionState } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({
  label,
  pending: pendingLabel,
}: {
  label: string;
  pending: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(login, null);
  const inCodeStage = state?.stage === "code";

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <p className="text-3xl">🍢</p>
          <h1 className="text-xl font-extrabold tracking-tight">관리자 로그인</h1>
          <p className="text-sm text-muted-foreground">
            명동 길거리 음식 가이드 관리
          </p>
        </div>

        {inCodeStage ? (
          // Step 2 — Telegram one-time code
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="step" value="code" />
            <p className="text-center text-sm text-muted-foreground">
              📲 텔레그램으로 보낸{" "}
              <span className="font-semibold text-foreground">6자리 코드</span>를
              입력하세요.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="code">인증 코드</Label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                placeholder="000000"
                className="text-center text-lg tracking-[0.5em]"
              />
            </div>

            {state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <SubmitButton label="확인" pending="확인 중..." />
          </form>
        ) : (
          // Step 1 — password
          <form action={formAction} className="space-y-4">
            <input
              type="hidden"
              name="redirect"
              value={searchParams.redirect ?? "/admin"}
            />
            <div className="space-y-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <SubmitButton label="로그인" pending="확인 중..." />
          </form>
        )}
      </div>
    </div>
  );
}
