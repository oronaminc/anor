"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Home, Map, Flame, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { TrendingFlame } from "@/components/TrendingFlame";

const ITEMS = [
  { href: "/", key: "home", icon: Home },
  { href: "/map", key: "map", icon: Map },
  { href: "/trending", key: "trending", icon: Flame },
  { href: "/search", key: "search", icon: Search },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 border-t border-white/5 glass"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-px h-[2px] w-9 rounded-full bg-primary glow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl transition-all",
                    active
                      ? "bg-primary/15 text-primary glow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {item.key === "trending" ? (
                    <TrendingFlame interactive={false} className="size-5" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </span>
                <span
                  className={cn(
                    "uppercase tracking-wide transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {t(item.key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
