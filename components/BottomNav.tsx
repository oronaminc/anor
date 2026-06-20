"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Home, Map, Flame, Search } from "lucide-react";

import { cn } from "@/lib/utils";

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
      className="sticky bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl"
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
                className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("size-5", active && "fill-primary/15")} />
                </span>
                <span
                  className={cn(
                    "transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {t(item.key)}
                </span>
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-px h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
