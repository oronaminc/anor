import { redirect, notFound } from "next/navigation";

import { getShopIdByShortId } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Short shareable link: /s/42 → the shop detail page. `code` is the shop's
 * short numeric id; a full UUID also works (so old /shop/<uuid> links and a
 * pasted UUID here both resolve). Redirects to the canonical /shop/<uuid>.
 */
export default async function ShortLinkPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.trim();

  // A UUID pasted here → straight to its detail page.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(code)) redirect(`/shop/${code}`);

  const n = Number(code);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const id = await getShopIdByShortId(n);
  if (!id) notFound();
  redirect(`/shop/${id}`);
}
