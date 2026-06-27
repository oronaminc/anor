import type { MetadataRoute } from "next";

import { getFoods } from "@/lib/queries";

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

  let foods: Awaited<ReturnType<typeof getFoods>> = [];
  try {
    foods = await getFoods();
  } catch {
    foods = [];
  }

  const foodRoutes = foods.map((food) => ({
    url: `${SITE_URL}/food/${food.id}`,
    lastModified: food.created_at,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...foodRoutes];
}
