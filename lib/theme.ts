export type Theme = "dark" | "light";
const KEY = "theme";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(KEY) as Theme) || "dark";
}

export function setTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  document.documentElement.dataset.theme = t;
}

export function initTheme() {
  const stored = localStorage.getItem(KEY) as Theme | null;
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  setTheme(stored ?? (prefersLight ? "light" : "dark"));
}
