import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-extrabold">
            <span className="text-xl">🍢</span>
            <span>명동 길거리 음식</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        <p>명동 길거리 음식 가이드</p>
        <p className="mt-1">
          데이터는 참고용이며 실제 영업 정보와 다를 수 있습니다.
        </p>
      </footer>
    </div>
  );
}
