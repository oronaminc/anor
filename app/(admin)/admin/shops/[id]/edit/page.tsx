import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getShopById } from "@/lib/queries";
import { ShopForm } from "@/components/admin/ShopForm";

export const dynamic = "force-dynamic";

export default async function EditShopPage({
  params,
}: {
  params: { id: string };
}) {
  const shop = await getShopById(params.id);

  if (!shop) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 목록으로
        </Link>
        <h1 className="text-2xl font-extrabold">가게 수정</h1>
        <p className="text-sm text-muted-foreground">{shop.name_ko}</p>
      </div>

      <ShopForm shop={shop} />
    </div>
  );
}
