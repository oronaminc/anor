"use client";

import { useTransition } from "react";
import { Eye, Heart } from "lucide-react";

import { boostShop } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

/** Admin-only "+1K" buttons: bump a shop's weekly + all-time likes/views. */
export function BoostButtons({ shopId }: { shopId: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => start(() => boostShop(shopId, "like"))}
      >
        +1K <Heart className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => start(() => boostShop(shopId, "view"))}
      >
        +1K <Eye className="size-3.5" />
      </Button>
    </div>
  );
}
