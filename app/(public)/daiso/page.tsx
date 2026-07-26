import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { RETAILERS } from "@/lib/retailers";
import { RetailRankingPage } from "@/components/RetailRankingPage";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = RETAILERS.daiso;
  const ja = locale === "ja";
  return {
    title: ja ? `${m.ja}人気アイテムランキング` : `${m.ko} 인기템 랭킹`,
    description: ja ? m.tagline_ja : m.tagline_ko,
  };
}

export default function DaisoPage() {
  return <RetailRankingPage retailer="daiso" />;
}
