import { MapPin } from "lucide-react";

import { getFoods } from "@/lib/queries";
import { TrendingSection } from "@/components/TrendingSection";
import { RankingSection } from "@/components/RankingSection";
import { FoodExplorer } from "@/components/FoodExplorer";
import KakaoMap from "@/components/KakaoMap";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const foods = await getFoods();

  return (
    <div className="space-y-8 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-accent px-5 py-10 text-primary-foreground">
        <div className="relative z-10 space-y-2">
          <p className="text-sm font-medium opacity-90">서울 · 명동</p>
          <h1 className="text-2xl font-extrabold leading-tight">
            명동 길거리 음식
            <br />몇 번의 탭으로 한눈에 🍢
          </h1>
          <p className="max-w-xs text-sm opacity-90">
            지금 뜨는 메뉴부터 위치, 길찾기까지. 명동 거리를 가장 맛있게
            즐기는 방법.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-6 -top-6 text-[120px] opacity-20">
          🌶️
        </div>
      </section>

      <div className="space-y-8 px-4">
        {foods.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            아직 등록된 음식이 없습니다.
            <br />
            Supabase 마이그레이션과 시드를 실행했는지 확인해 주세요.
          </div>
        ) : (
          <>
            <TrendingSection foods={foods} />
            <RankingSection foods={foods} />

            {/* Map */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                <h2 className="text-lg font-bold">지도에서 보기</h2>
              </div>
              <KakaoMap
                foods={foods}
                height="300px"
                linkToDetail
                className="overflow-hidden rounded-xl border"
              />
              <p className="text-xs text-muted-foreground">
                마커를 탭하면 음식 상세로 이동합니다.
              </p>
            </section>

            <FoodExplorer foods={foods} />
          </>
        )}
      </div>
    </div>
  );
}
