import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl">🍢</p>
      <h1 className="text-xl font-extrabold">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-muted-foreground">
        요청하신 음식이나 페이지가 존재하지 않습니다.
      </p>
      <Button asChild>
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </div>
  );
}
