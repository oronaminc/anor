import { redirect, notFound } from "next/navigation";

import { getProductIdByShortId } from "@/lib/products";

export const dynamic = "force-dynamic";

/**
 * Short shareable link: /p/42 → the product detail page. `code` is the product's
 * short numeric id; a full UUID also works. Redirects to /product/<uuid>.
 */
export default async function ProductShortLinkPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.trim();

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(code)) redirect(`/product/${code}`);

  const n = Number(code);
  if (!Number.isInteger(n) || n <= 0) notFound();

  const id = await getProductIdByShortId(n);
  if (!id) notFound();
  redirect(`/product/${id}`);
}
