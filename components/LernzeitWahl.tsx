"use client";
import { useSyncExternalStore } from "react";
import { lernzeitStore } from "@/lib/appStores";
import { LERNZEITEN } from "@/lib/lernzeit";

export function LernzeitWahl() {
  const minuten = useSyncExternalStore(lernzeitStore.subscribe, lernzeitStore.getSnapshot, lernzeitStore.getServerSnapshot);
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">Wie viel Zeit hast du?</legend>
      <div className="flex gap-2">
        {LERNZEITEN.map((n) => (
          <button key={n} onClick={() => lernzeitStore.set(n)} aria-pressed={n === minuten}
            className="min-h-11 min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: n === minuten ? "var(--accent)" : "var(--surface)", color: n === minuten ? "var(--accent-text)" : "var(--text)" }}>
            {n} Minuten
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Geschätzte Dauer mit Zeit für Erklärungen. Kein Zeitdruck.</p>
    </fieldset>
  );
}
