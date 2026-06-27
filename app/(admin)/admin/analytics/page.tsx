import Link from "next/link";
import { ArrowLeft, Search, Eye, Heart, SearchX } from "lucide-react";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import type { SearchEvent } from "@/lib/types";
import { formatViewCount } from "@/lib/utils";

export const dynamic = "force-dynamic";

type FoodStat = {
  id: string;
  name_ko: string;
  view_count: number;
  like_count: number;
};

type TermStat = { term: string; sample: string; count: number; zero: number };

const RECENT_WINDOW = 1000;

async function loadAnalytics() {
  if (!hasDb()) {
    return {
      configured: false,
      total: 0,
      events: [] as SearchEvent[],
      topFoods: [] as FoodStat[],
      likedFoods: [] as FoodStat[],
    };
  }

  const sql = getSql();
  const [events, topFoods, likedFoods, totalRows] = await Promise.all([
    sql`SELECT * FROM search_events ORDER BY created_at DESC LIMIT ${RECENT_WINDOW}`,
    sql`SELECT id, name_ko, view_count, like_count FROM foods ORDER BY view_count DESC LIMIT 10`,
    sql`SELECT id, name_ko, view_count, like_count FROM foods ORDER BY like_count DESC LIMIT 10`,
    sql`SELECT count(*)::int AS count FROM search_events`,
  ]);

  return {
    configured: true,
    total: (totalRows[0]?.count as number) ?? events.length,
    events: events as SearchEvent[],
    topFoods: topFoods as FoodStat[],
    likedFoods: likedFoods as FoodStat[],
  };
}

function aggregate(events: SearchEvent[]): { top: TermStat[]; zero: TermStat[] } {
  const map = new Map<string, TermStat>();
  for (const e of events) {
    const key = e.normalized;
    if (!key) continue;
    const cur =
      map.get(key) ?? { term: key, sample: e.query, count: 0, zero: 0 };
    cur.count += 1;
    if (e.results_count === 0) cur.zero += 1;
    map.set(key, cur);
  }
  const all = Array.from(map.values());
  return {
    top: [...all].sort((a, b) => b.count - a.count).slice(0, 20),
    zero: all
      .filter((t) => t.zero > 0)
      .sort((a, b) => b.zero - a.zero)
      .slice(0, 20),
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default async function AdminAnalyticsPage() {
  const { configured, total, events, topFoods, likedFoods } =
    await loadAnalytics();
  const { top, zero } = aggregate(events);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 목록으로
        </Link>
        <h1 className="text-2xl font-extrabold">통계 · 수집 현황</h1>
        <p className="text-sm text-muted-foreground">
          검색어 수집과 조회·좋아요 인기 순위 (최근 {RECENT_WINDOW.toLocaleString()}
          건 기준)
        </p>
      </div>

      {!configured ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          데이터베이스(DATABASE_URL)가 연결되지 않아 수집 데이터를 불러올 수
          없습니다. 배포 환경에서 Neon 연결을 설정하면 검색어가 집계됩니다.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Search className="size-4" />}
              label="검색 수집"
              value={formatViewCount(total)}
            />
            <StatCard
              icon={<Eye className="size-4" />}
              label="총 조회"
              value={formatViewCount(
                topFoods.reduce((s, f) => s + f.view_count, 0),
              )}
              hint="상위 10개 합계"
            />
            <StatCard
              icon={<Heart className="size-4" />}
              label="총 좋아요"
              value={formatViewCount(
                likedFoods.reduce((s, f) => s + f.like_count, 0),
              )}
              hint="상위 10개 합계"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="인기 검색어" icon={<Search className="size-4" />}>
              {top.length === 0 ? (
                <Empty>아직 수집된 검색어가 없습니다.</Empty>
              ) : (
                <ol className="divide-y">
                  {top.map((t, i) => (
                    <li
                      key={t.term}
                      className="flex items-center gap-3 py-2.5 text-sm"
                    >
                      <span className="w-5 shrink-0 text-right font-bold tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {t.sample || t.term}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {t.count.toLocaleString()}회
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            <Panel
              title="결과 없는 검색어"
              icon={<SearchX className="size-4" />}
            >
              <p className="-mt-1 mb-2 text-xs text-muted-foreground">
                메뉴 추가/번역에 참고하세요.
              </p>
              {zero.length === 0 ? (
                <Empty>결과 없는 검색이 아직 없습니다.</Empty>
              ) : (
                <ol className="divide-y">
                  {zero.map((t) => (
                    <li
                      key={t.term}
                      className="flex items-center gap-3 py-2.5 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {t.sample || t.term}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {t.zero.toLocaleString()}회
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            <Panel title="조회 TOP 10" icon={<Eye className="size-4" />}>
              <FoodRanking foods={topFoods} metric="view" />
            </Panel>

            <Panel title="좋아요 TOP 10" icon={<Heart className="size-4" />}>
              <FoodRanking foods={likedFoods} metric="like" />
            </Panel>
          </div>

          <Panel title="최근 검색" icon={<Search className="size-4" />}>
            {events.length === 0 ? (
              <Empty>최근 검색이 없습니다.</Empty>
            ) : (
              <ul className="divide-y">
                {events.slice(0, 30).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {e.query}
                    </span>
                    {e.locale && (
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] uppercase text-muted-foreground">
                        {e.locale}
                      </span>
                    )}
                    <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                      {e.results_count ?? "-"}건
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                      {timeAgo(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-2 flex items-center gap-2 text-base font-bold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function FoodRanking({
  foods,
  metric,
}: {
  foods: FoodStat[];
  metric: "view" | "like";
}) {
  if (foods.length === 0) return <Empty>데이터가 없습니다.</Empty>;
  return (
    <ol className="divide-y">
      {foods.map((f, i) => (
        <li key={f.id} className="flex items-center gap-3 py-2.5 text-sm">
          <span className="w-5 shrink-0 text-right font-bold tabular-nums text-muted-foreground">
            {i + 1}
          </span>
          <Link
            href={`/admin/foods/${f.id}/edit`}
            className="min-w-0 flex-1 truncate font-medium hover:underline"
          >
            {f.name_ko}
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums text-muted-foreground">
            {metric === "view" ? (
              <Eye className="size-3.5" />
            ) : (
              <Heart className="size-3.5" />
            )}
            {formatViewCount(metric === "view" ? f.view_count : f.like_count)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-sm text-muted-foreground">{children}</p>;
}
