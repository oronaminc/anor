"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type Accent,
  type Mode,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  STORAGE_ACCENT,
  STORAGE_MODE,
} from "./theme";

type ThemeContextValue = {
  accent: Accent;
  mode: Mode;
  resolvedDark: boolean;
  setAccent: (a: Accent) => void;
  setMode: (m: Mode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyToDocument(accent: Accent, mode: Mode) {
  const el = document.documentElement;
  el.dataset.accent = accent;
  const dark = mode === "dark" || (mode === "system" && systemPrefersDark());
  el.classList.toggle("dark", dark);
  return dark;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<Accent>(DEFAULT_ACCENT);
  const [mode, setModeState] = useState<Mode>(DEFAULT_MODE);
  const [resolvedDark, setResolvedDark] = useState(false);

  // Hydrate from storage (the inline script already applied classes pre-paint).
  useEffect(() => {
    const storedAccent = (localStorage.getItem(STORAGE_ACCENT) ??
      DEFAULT_ACCENT) as Accent;
    const storedMode = (localStorage.getItem(STORAGE_MODE) ??
      DEFAULT_MODE) as Mode;
    setAccentState(storedAccent);
    setModeState(storedMode);
    setResolvedDark(applyToDocument(storedAccent, storedMode));
    // Enable smooth transitions only after first paint.
    requestAnimationFrame(() =>
      document.documentElement.classList.add("theme-anim"),
    );
  }, []);

  // React to OS changes when in system mode.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedDark(applyToDocument(accent, "system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode, accent]);

  const setAccent = useCallback(
    (a: Accent) => {
      setAccentState(a);
      localStorage.setItem(STORAGE_ACCENT, a);
      setResolvedDark(applyToDocument(a, mode));
    },
    [mode],
  );

  const setMode = useCallback(
    (m: Mode) => {
      setModeState(m);
      localStorage.setItem(STORAGE_MODE, m);
      setResolvedDark(applyToDocument(accent, m));
    },
    [accent],
  );

  return (
    <ThemeContext.Provider
      value={{ accent, mode, resolvedDark, setAccent, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
