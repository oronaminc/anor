export const ACCENTS = ["huntrix", "sax", "lavender", "gold", "demon"] as const;
export type Accent = (typeof ACCENTS)[number];

export type Mode = "light" | "dark" | "system";

export const DEFAULT_ACCENT: Accent = "huntrix";
export const DEFAULT_MODE: Mode = "dark";

export const STORAGE_ACCENT = "md.accent";
export const STORAGE_MODE = "md.mode";

/** Holographic swatch gradients for the picker — must track globals.css. */
export const ACCENT_SWATCH: Record<Accent, string> = {
  huntrix:
    "linear-gradient(135deg, hsl(328 98% 63%), hsl(272 94% 67%) 52%, hsl(202 98% 60%))",
  sax: "linear-gradient(135deg, hsl(200 96% 56%), hsl(187 92% 56%) 52%, hsl(264 92% 72%))",
  lavender:
    "linear-gradient(135deg, hsl(264 94% 72%), hsl(322 94% 72%) 52%, hsl(210 94% 74%))",
  gold: "linear-gradient(135deg, hsl(42 98% 57%), hsl(16 94% 60%) 52%, hsl(322 92% 62%))",
  demon:
    "linear-gradient(135deg, hsl(268 94% 66%), hsl(322 94% 62%) 52%, hsl(222 94% 66%))",
};

/** Solid glow color (for the selected swatch ring shadow). */
export const ACCENT_GLOW: Record<Accent, string> = {
  huntrix: "hsl(318 98% 65%)",
  sax: "hsl(196 98% 60%)",
  lavender: "hsl(280 94% 74%)",
  gold: "hsl(40 98% 60%)",
  demon: "hsl(288 94% 66%)",
};
