"use client";

import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor, Check } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { ACCENTS, ACCENT_SWATCH, type Mode } from "@/components/theme/theme";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

export function AppearancePanel() {
  const t = useTranslations("appearance");
  const { accent, mode, setAccent, setMode } = useTheme();

  const modes: { value: Mode; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t("light"), icon: <Sun className="size-4" /> },
    { value: "dark", label: t("dark"), icon: <Moon className="size-4" /> },
    { value: "system", label: t("system"), icon: <Monitor className="size-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Mode */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("mode")}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              aria-pressed={mode === m.value}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors",
                mode === m.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* Accent */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("theme")}
        </h3>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAccent(a)}
              aria-label={t(`presets.${a}`)}
              aria-pressed={accent === a}
              title={t(`presets.${a}`)}
              className={cn(
                "relative size-10 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                accent === a ? "ring-foreground" : "ring-transparent",
              )}
              style={{
                backgroundColor: ACCENT_SWATCH[a],
                boxShadow:
                  accent === a ? `0 0 18px ${ACCENT_SWATCH[a]}` : undefined,
              }}
            >
              {accent === a && (
                <Check className="absolute inset-0 m-auto size-5 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Language */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("language")}
        </h3>
        <LanguageSwitcher />
      </section>
    </div>
  );
}
