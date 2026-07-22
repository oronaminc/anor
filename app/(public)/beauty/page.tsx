import type { Metadata } from "next";

import { RetailRankingPage } from "@/components/RetailRankingPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "올리브영 인기 랭킹 · 명동",
  description: "명동에서 사는 올리브영 K-뷰티 인기 화장품 랭킹.",
};

export default function BeautyPage() {
  return <RetailRankingPage retailer="olive_young" />;
}
