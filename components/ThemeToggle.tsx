"use client";
import { useSyncExternalStore } from "react";
import { setTheme, subscribeTheme, themeSnapshot, themeServerSnapshot } from "@/lib/theme";

export function ThemeToggle() {
  const t = useSyncExternalStore(subscribeTheme, themeSnapshot, themeServerSnapshot);
  const flip = () => setTheme(t === "dark" ? "light" : "dark");
  return (
    <button
      onClick={flip}
      aria-label="Design umschalten"
      className="rounded-lg border px-3 py-2 text-sm"
      style={{ borderColor: "var(--border)", color: "var(--text)" }}
    >
      {t === "dark" ? "☀︎ Hell" : "☾ Dunkel"}
    </button>
  );
}
