import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

const MODE_STORAGE_KEY = "relay-theme-mode";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: "light" | "dark"; // what's actually applied right now, useful for icons etc.
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// NOTE: this intentionally does NOT touch document.documentElement.
// Dark mode is scoped to the authenticated dashboard only (see how
// resolvedTheme is consumed in Dashboard.tsx's wrapper div) - the public
// marketing site (homepage, pricing, etc.) was never designed with dark
// variants and stays fixed-light regardless of a logged-in user's
// preference here.
function resolveTheme(mode: ThemeMode): "light" | "dark" {
  return mode === "dark" || (mode === "system" && getSystemPrefersDark())
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return (stored as ThemeMode) || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Apply mode on mount + whenever it changes (no direct DOM manipulation -
  // resolvedTheme is consumed by the dashboard shell to apply the "dark"
  // class only where it belongs)
  useEffect(() => {
    setResolvedTheme(resolveTheme(mode));
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  // Live-update if mode is "system" and the OS theme changes while the app is open
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(resolveTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  function setMode(next: ThemeMode) {
    setModeState(next);
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}