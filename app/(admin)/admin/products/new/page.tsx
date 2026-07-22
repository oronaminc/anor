import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 목록으로
        </Link>
        <h1 className="text-2xl font-extrabold">새 상품 추가</h1>
      </div>

      <ProductForm />
    </div>
  );
}
