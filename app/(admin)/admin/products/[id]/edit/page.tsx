import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getProductById } from "@/lib/products";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductById(params.id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 목록으로
        </Link>
        <h1 className="text-2xl font-extrabold">상품 수정</h1>
        <p className="text-sm text-muted-foreground">{product.name_ko}</p>
      </div>

      <ProductForm product={product} />
    </div>
  );
}
