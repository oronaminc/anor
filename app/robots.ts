import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://hellomyeongdong.com"
).replace(/\/$/, "");

/**
 * Public pages are crawlable; the admin area and API are not. This keeps the
 * private admin out of search results (defense in depth alongside the auth
 * gate and the per-page noindex metadata).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
