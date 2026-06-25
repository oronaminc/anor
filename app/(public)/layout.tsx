import { getTranslations } from "next-intl/server";

import { SiteHeader } from "@/components/SiteHeader";
import { BottomNav } from "@/components/BottomNav";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");
  const tf = await getTranslations("footer");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-transparent sm:border-x sm:border-white/5">
      <SiteHeader />

      <main className="flex-1 pb-2">{children}</main>

      <footer className="mx-auto max-w-md px-4 pb-3 pt-6 text-center text-xs text-muted-foreground">
        <p className="font-display uppercase tracking-widest text-foreground/70">
          {t("tagline")}
        </p>
        <p className="mt-1 opacity-70">{tf("disclaimer")}</p>
      </footer>

      <BottomNav />
    </div>
  );
}
