"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteFood } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";

export function DeleteFoodButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`${name} 삭제`}
      onClick={() => {
        if (!confirm(`'${name}' 을(를) 삭제할까요?`)) return;
        startTransition(() => {
          void deleteFood(id);
        });
      }}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
