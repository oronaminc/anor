import type { MetadataRoute } from "next";

import { getShops } from "@/lib/queries";

export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://myeongdong-street-food.vercel.app"
).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/trending", "/search", "/map"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  let shops: Awaited<ReturnType<typeof getShops>> = [];
  try {
    shops = await getShops();
  } catch {
    shops = [];
  }

  const shopRoutes = shops.map((shop) => ({
    url: `${SITE_URL}/shop/${shop.id}`,
    lastModified: shop.created_at,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...shopRoutes];
}
