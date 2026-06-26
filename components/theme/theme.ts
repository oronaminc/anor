export const ACCENTS = ["huntrix", "sax", "lavender", "gold", "demon"] as const;
export type Accent = (typeof ACCENTS)[number];

export type Mode = "light" | "dark" | "system";

export const DEFAULT_ACCENT: Accent = "huntrix";
export const DEFAULT_MODE: Mode = "dark";

export const STORAGE_ACCENT = "md.accent";
export const STORAGE_MODE = "md.mode";

/** Monochrome swatch gradients for the picker — must track globals.css. */
export const ACCENT_SWATCH: Record<Accent, string> = {
  huntrix: "linear-gradient(135deg, hsl(0 0% 8%), hsl(0 0% 38%))",
  sax: "linear-gradient(135deg, hsl(0 0% 96%), hsl(0 0% 62%))",
  lavender: "linear-gradient(135deg, hsl(0 0% 22%), hsl(0 0% 78%))",
  gold: "linear-gradient(135deg, hsl(0 0% 50%), hsl(0 0% 14%))",
  demon: "linear-gradient(135deg, hsl(0 0% 70%), hsl(0 0% 30%))",
};

/** Solid glow color (for the selected swatch ring shadow). */
export const ACCENT_GLOW: Record<Accent, string> = {
  huntrix: "hsl(0 0% 50% / 0.5)",
  sax: "hsl(0 0% 50% / 0.5)",
  lavender: "hsl(0 0% 50% / 0.5)",
  gold: "hsl(0 0% 50% / 0.5)",
  demon: "hsl(0 0% 50% / 0.5)",
};
