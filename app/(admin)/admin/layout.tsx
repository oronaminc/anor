import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resilient: on a zero-config sample deploy (no Supabase) this would throw,
  // so fall back to "no user" and render the bare login screen.
  let user = null;
  try {
    const supabase = createClient();
    user = (await supabase.auth.getUser()).data.user;
  } catch {
    user = null;
  }

  // Unauthenticated requests only reach here on /admin/login
  // (middleware redirects all other /admin/* paths). Render bare.
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2 font-extrabold">
            <span>🍢</span>
            <span>관리자</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              사이트 보기 ↗
            </Link>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                로그아웃
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
