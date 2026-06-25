export const ACCENTS = ["demon", "cyber", "soul", "gold", "toxic"] as const;
export type Accent = (typeof ACCENTS)[number];

export type Mode = "light" | "dark" | "system";

export const DEFAULT_ACCENT: Accent = "demon";
export const DEFAULT_MODE: Mode = "dark";

export const STORAGE_ACCENT = "md.accent";
export const STORAGE_MODE = "md.mode";

/** Swatch colors (CSS) used in the appearance picker — must track globals.css. */
export const ACCENT_SWATCH: Record<Accent, string> = {
  demon: "hsl(330 92% 56%)",
  cyber: "hsl(188 95% 50%)",
  soul: "hsl(266 92% 66%)",
  gold: "hsl(42 96% 56%)",
  toxic: "hsl(150 90% 48%)",
};
