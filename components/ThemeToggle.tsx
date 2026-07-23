"use client";
import { useSyncExternalStore } from "react";
import { setTheme, subscribeTheme, themeSnapshot, themeServerSnapshot } from "@/lib/theme";

export function ThemeToggle() {
  const t = useSyncExternalStore(subscribeTheme, themeSnapshot, themeServerSnapshot);
  return (
    <div
      role="group"
      aria-label="Design"
      className="flex items-center rounded-full border p-0.5 text-xs font-semibold"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {(["light", "dark"] as const).map((mode) => {
        const aktiv = t === mode;
        return (
          <button
            key={mode}
            onClick={() => setTheme(mode)}
            aria-pressed={aktiv}
            className="rounded-full px-3 py-1 transition-colors"
            style={
              aktiv
                ? { background: "var(--accent)", color: "var(--accent-text)" }
                : { background: "transparent", color: "var(--text-muted)" }
            }
          >
            {mode === "light" ? "Hell" : "Dunkel"}
          </button>
        );
      })}
    </div>
  );
}
