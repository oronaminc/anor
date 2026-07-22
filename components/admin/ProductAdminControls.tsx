"use client";

import { useTransition } from "react";
import { Flame, Eye, Heart, Trash2 } from "lucide-react";

import {
  toggleProductTrending,
  boostProduct,
  deleteProduct,
} from "@/app/(admin)/admin/products/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TrendingFlame } from "@/components/TrendingFlame";

export function ProductTrendingToggle({
  productId,
  isTrending,
}: {
  productId: string;
  isTrending: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void toggleProductTrending(productId, !isTrending))}
      aria-pressed={isTrending}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
        isTrending
          ? "border-transparent bg-accent text-accent-foreground"
          : "bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {isTrending ? (
        <TrendingFlame interactive={false} className="size-3.5" />
      ) : (
        <Flame className="size-3.5" />
      )}
      {isTrending ? "급상승 ON" : "급상승 OFF"}
    </button>
  );
}

export function ProductBoostButtons({ productId }: { productId: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => start(() => boostProduct(productId, "like"))}
      >
        +1K <Heart className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => start(() => boostProduct(productId, "view"))}
      >
        +1K <Eye className="size-3.5" />
      </Button>
    </div>
  );
}

export function DeleteProductButton({
  productId,
  name,
}: {
  productId: string;
  name: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`${name} 삭제`}
      onClick={() => {
        if (!confirm(`'${name}' 을(를) 삭제할까요?`)) return;
        start(() => void deleteProduct(productId));
      }}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
