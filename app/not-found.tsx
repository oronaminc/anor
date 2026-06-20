import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl">🍢</p>
      <h1 className="text-xl font-extrabold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("desc")}</p>
      <Button asChild>
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
}
