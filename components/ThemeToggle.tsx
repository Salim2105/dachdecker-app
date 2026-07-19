"use client";
import { useEffect, useState } from "react";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [t, setT] = useState<Theme>("dark");
  useEffect(() => {
    const applied = (document.documentElement.dataset.theme as Theme) || getTheme();
    setT(applied);
  }, []);
  const flip = () => {
    const n: Theme = t === "dark" ? "light" : "dark";
    setTheme(n);
    setT(n);
  };
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
