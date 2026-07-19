export type Theme = "dark" | "light";
const KEY = "theme";
const listeners = new Set<() => void>();

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(KEY) as Theme) || "dark";
}

export function setTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  document.documentElement.dataset.theme = t;
  listeners.forEach((l) => l());
}

export function initTheme() {
  const stored = localStorage.getItem(KEY) as Theme | null;
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  setTheme(stored ?? (prefersLight ? "light" : "dark"));
}

// External store for React components (hydration-safe via useSyncExternalStore).
export function subscribeTheme(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function themeSnapshot(): Theme {
  if (typeof document === "undefined") return "dark";
  return (document.documentElement.dataset.theme as Theme) || "dark";
}

export function themeServerSnapshot(): Theme {
  return "dark";
}
