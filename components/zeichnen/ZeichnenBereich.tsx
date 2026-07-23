"use client";
import { useState } from "react";
import type { DrawAufgabe, Bewertung } from "@/content/schema";
import { DrawCard } from "@/components/aufgaben/DrawCard";
import { useProgress } from "@/components/useProgress";
import { getLernfeld } from "@/lib/content";
import { alleZeichenaufgaben, zeichenaufgabenNachLernfeld } from "@/lib/zeichnen";
import { zieheAufgaben } from "@/lib/pruefung";

export function ZeichnenBereich() {
  const { fortschritt, bewerte } = useProgress();
  const [lauf, setLauf] = useState<DrawAufgabe[] | null>(null);
  const [index, setIndex] = useState(0);
  const [beantwortet, setBeantwortet] = useState(false);

  const gruppen = zeichenaufgabenNachLernfeld();
  const alle = alleZeichenaufgaben();

  const starte = (aufgaben: DrawAufgabe[]) => {
    setLauf(aufgaben);
    setIndex(0);
    setBeantwortet(false);
  };

  if (lauf) {
    const aktuell = lauf[index];
    const lf = getLernfeld(aktuell.lernfeld);
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setLauf(null)} className="text-sm" style={{ color: "var(--text-muted)" }}>
            ← Zeichnen
          </button>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {index + 1} / {lauf.length}
          </span>
        </div>
        <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
          {lf ? `LF ${lf.nr} · ${lf.titel}` : aktuell.lernfeld}
        </p>

        <DrawCard
          key={aktuell.id}
          aufgabe={aktuell}
          onErgebnis={(b: Bewertung) => {
            setBeantwortet(true);
            bewerte(aktuell.id, b);
          }}
        />

        {beantwortet && (
          <button
            onClick={() => {
              if (index < lauf.length - 1) {
                setIndex((i) => i + 1);
                setBeantwortet(false);
              } else {
                setLauf(null);
              }
            }}
            className="mt-6 w-full rounded-xl py-3 font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            {index < lauf.length - 1 ? "Nächste Zeichnung" : "Fertig"}
          </button>
        )}
      </div>
    );
  }

  const geuebt = alle.filter((a) => fortschritt[a.id]).length;

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight">Zeichnen</h1>
      <p className="mt-1 text-[15px]" style={{ color: "var(--text-muted)" }}>
        Freihandzeichnungen und geometrische Konstruktionen für Dach &amp; Wand üben.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={() => starte(zieheAufgaben(alle, alle.length))}
          className="rounded-xl py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          Alle {alle.length} zeichnen, gemischt
        </button>
        {geuebt < alle.length && (
          <button
            onClick={() => starte(alle.filter((a) => !fortschritt[a.id]))}
            className="rounded-xl border py-3 font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Nur die {alle.length - geuebt} noch offenen
          </button>
        )}
      </div>

      <h2
        className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--text-faint)" }}
      >
        Einzeln auswählen
      </h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {gruppen.map((g) => {
          const lf = getLernfeld(g.lernfeld);
          return g.aufgaben.map((a) => {
            const status = fortschritt[a.id]?.bewertung;
            const pille =
              status === "richtig"
                ? { text: "sitzt", farbe: "var(--ok)" }
                : status === "teilweise"
                  ? { text: "fast", farbe: "var(--accent)" }
                  : status === "falsch"
                    ? { text: "nochmal", farbe: "var(--bad)" }
                    : null;
            return (
              <button
                key={a.id}
                onClick={() => starte([a])}
                className="rounded-[var(--r-lg)] border p-4 text-left transition-transform active:scale-[0.99]"
                style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {lf ? (/^\d/.test(lf.nr) ? `LF ${lf.nr}` : lf.nr) : g.lernfeld} · {a.thema}
                  </span>
                  {pille && (
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: `color-mix(in srgb, ${pille.farbe} 18%, transparent)`, color: pille.farbe }}
                    >
                      {pille.text}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {a.aufgabentext.split(/(?<=\.)\s/)[0]}
                </div>
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}
