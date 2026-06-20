export const ACCENTS = ["red", "orange", "mint", "purple", "mono"] as const;
export type Accent = (typeof ACCENTS)[number];

export type Mode = "light" | "dark" | "system";

export const DEFAULT_ACCENT: Accent = "red";
export const DEFAULT_MODE: Mode = "light";

export const STORAGE_ACCENT = "md.accent";
export const STORAGE_MODE = "md.mode";

/** Swatch colors (CSS) used in the appearance picker — must track globals.css. */
export const ACCENT_SWATCH: Record<Accent, string> = {
  red: "hsl(350 89% 60%)",
  orange: "hsl(24 94% 53%)",
  mint: "hsl(168 80% 40%)",
  purple: "hsl(263 84% 62%)",
  mono: "hsl(222 18% 28%)",
};

export const ACCENT_KEYS: Record<Accent, string> = {
  red: "red",
  orange: "orange",
  mint: "mint",
  purple: "purple",
  mono: "mono",
};
