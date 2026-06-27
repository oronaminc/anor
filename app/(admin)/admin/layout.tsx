import type { Metadata } from "next";
import Link from "next/link";

import { isAdmin } from "@/lib/auth";
import { logout } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// Never let the admin area be indexed by search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only a signed-in admin sees the dashboard chrome; everyone else gets the
  // bare login screen. Middleware already redirects non-admins away from
  // protected paths, so this is defense in depth.
  if (!(await isAdmin())) {
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
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              음식
            </Link>
            <Link
              href="/admin/analytics"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              통계
            </Link>
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
