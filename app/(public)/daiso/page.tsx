import type { Metadata } from "next";

import { RetailRankingPage } from "@/components/RetailRankingPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "다이소 인기템 랭킹 · 명동",
  description: "명동 다이소 필수템 · 가성비 굿즈 랭킹.",
};

export default function DaisoPage() {
  return <RetailRankingPage retailer="daiso" />;
}
