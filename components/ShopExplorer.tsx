"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";

import type { ShopWithFoods, SortKey } from "@/lib/types";
import { sortShops } from "@/lib/sort";
import { cn } from "@/lib/utils";
import { ShopPost } from "@/components/ShopPost";
import { CATEGORIES, categoryLabel } from "@/lib/categories";

const PAGE = 24;

export function ShopExplorer({ shops }: { shops: ShopWithFoods[] }) {
  const t = useTranslations("home");
  const ts = useTranslations("sort");
  const locale = useLocale();
  const [sort, setSort] = useState<SortKey>("popular");
  const [cat, setCat] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  // Only categories actually present, in canonical order.
  const cats = useMemo(() => {
    const present = new Set(shops.flatMap((s) => s.categories ?? []));
    return CATEGORIES.filter((c) => present.has(c.code));
  }, [shops]);

  const filtered = useMemo(() => {
    const base = cat
      ? shops.filter((s) => (s.categories ?? []).includes(cat))
      : shops;
    // Trending shops are pinned to the top; the sort key applies within groups.
    return sortShops(base, sort, { trendingFirst: true });
  }, [shops, sort, cat]);

  // Reset the visible window whenever the filter/sort changes.
  useEffect(() => {
    setLimit(PAGE);
  }, [cat, sort]);

  const visible = filtered.slice(0, limit);
  const remaining = filtered.length - visible.length;

  return (
    <section id="explore" aria-label={t("allMenu")}>
      <h2 className="sr-only">{t("allMenu")}</h2>

      {cats.length > 0 && (
        <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          <CatChip active={cat === null} onClick={() => setCat(null)}>
            {t("all")}
          </CatChip>
          {cats.map((c) => (
            <CatChip
              key={c.code}
              active={cat === c.code}
              onClick={() => setCat(c.code)}
            >
              {c.emoji} {categoryLabel(c.code, locale)}
            </CatChip>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
        <div role="tablist" aria-label={ts("label")} className="flex gap-5">
          <SortTab
            active={sort === "popular"}
            onClick={() => setSort("popular")}
            label={ts("popular")}
          />
          <SortTab
            active={sort === "latest"}
            onClick={() => setSort("latest")}
            label={ts("latest")}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {t("count", { count: filtered.length })}
        </span>
      </div>

      <div className="divide-y divide-border">
        {visible.map((shop) => (
          <ShopPost key={shop.id} shop={shop} />
        ))}
      </div>

      {remaining > 0 && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {t("more")} ({remaining})
          </button>
        </div>
      )}

      <BackToTop />
    </section>
  );
}

function CatChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function SortTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative py-2 text-sm font-semibold transition-colors",
        active
          ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

/** Floating "back to top" button that appears once the user scrolls down. */
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-24 right-4 z-40 inline-flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
    >
      <ArrowUp className="size-5" />
    </button>
  );
}
