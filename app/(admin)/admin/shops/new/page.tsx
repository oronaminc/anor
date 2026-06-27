import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ShopForm } from "@/components/admin/ShopForm";

export const dynamic = "force-dynamic";

export default function NewShopPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 목록으로
        </Link>
        <h1 className="text-2xl font-extrabold">새 가게 추가</h1>
      </div>

      <ShopForm />
    </div>
  );
}
