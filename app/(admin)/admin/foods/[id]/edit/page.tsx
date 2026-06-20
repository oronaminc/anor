import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { updateFood } from "@/app/(admin)/admin/actions";
import { FoodForm } from "@/components/admin/FoodForm";

export const dynamic = "force-dynamic";

export default async function EditFoodPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: food } = await supabase
    .from("foods")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!food) notFound();

  // Bind the food id so the form action matches (prev, formData) signature.
  const action = updateFood.bind(null, food.id);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 목록으로
        </Link>
        <h1 className="text-2xl font-extrabold">음식 수정</h1>
        <p className="text-sm text-muted-foreground">{food.name_ko}</p>
      </div>

      <FoodForm action={action} food={food} submitLabel="저장하기" />
    </div>
  );
}
