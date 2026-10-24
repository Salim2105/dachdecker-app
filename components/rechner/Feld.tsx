"use client";

import { useId, type ReactNode } from "react";
import { leseDezimalzahl } from "@/lib/zahlen";
import { RechenFehler } from "@/lib/rechner";

export function Feld({ label, einheit, wert, onWert, fehler, hilfe }: {
  label: string; einheit?: string; wert: string; onWert: (v: string) => void;
  schritt?: string; fehler?: string; hilfe?: string;
}) {
  const id = useId();
  return (
    <div className="py-2">
      <label htmlFor={id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <input id={id} type="text" inputMode="decimal" value={wert} onChange={(e) => onWert(e.target.value)}
            aria-invalid={!!fehler} aria-describedby={fehler || hilfe ? `${id}-hinweis` : undefined}
            className="w-28 rounded-lg border px-3 py-2 text-right text-base focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ borderColor: fehler ? "var(--bad, #b42318)" : "var(--border)", background: "var(--surface-2)", color: "var(--text)", outlineColor: "var(--accent)" }} />
          <span className="w-12 text-xs" style={{ color: "var(--text-muted)" }}>{einheit}</span>
        </span>
      </label>
      {(fehler || hilfe) && <p id={`${id}-hinweis`} className="mt-1 text-sm" style={{ color: fehler ? "var(--bad, #b42318)" : "var(--text-muted)" }}>{fehler || hilfe}</p>}
    </div>
  );
}

export function Ergebnis({ label, wert, einheit, gross = false }: { label: string; wert: string; einheit: string; gross?: boolean }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-2 py-1">
    <span className="text-sm">{label}</span>
    <span className={`${gross ? "text-2xl font-semibold" : "text-lg"} tabular-nums`} style={{ color: gross ? "var(--accent)" : "var(--text)" }}>{wert} <span className="text-sm">{einheit}</span></span>
  </div>;
}

export function Hinweis({ children }: { children: ReactNode }) {
  return <div className="mt-3 rounded-xl p-3 text-sm leading-relaxed" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>{children}</div>;
}

export function Block({ children }: { children: ReactNode }) {
  return <div className="min-w-0 rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>{children}</div>;
}

/** Keine Teilzahlen und kein stiller Nullersatz für ein leeres Eingabefeld. */
export function num(v: string): number {
  const n = leseDezimalzahl(v);
  if (n === null) throw new RechenFehler("Bitte eine Zahl ohne Einheit oder Tausendertrennzeichen eingeben.");
  return n;
}
