"use client";
import { useState } from "react";
import type { DiagramAufgabe, Bewertung, AufgabeModus } from "@/content/schema";
import { SafeSvg } from "@/components/SafeSvg";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";
import { trefferRueckmeldung, pulsKlasse } from "@/lib/rueckmeldung";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function DiagramCard({
  aufgabe,
  onErgebnis,
  modus = "uebung",
}: {
  aufgabe: DiagramAufgabe;
  onErgebnis: (b: Bewertung) => void;
  modus?: AufgabeModus;
}) {
  const aufloesen = modus === "uebung";
  const keys = Object.keys(aufgabe.zuordnung);
  const [pool] = useState<string[]>(() => shuffle([...new Set(Object.values(aufgabe.zuordnung))]));
  const [auswahl, setAuswahl] = useState<Record<string, string>>({});
  const [geprueft, setGeprueft] = useState(false);
  const [bewertung, setBewertung] = useState<Bewertung | null>(null);

  const pruefen = () => {
    setGeprueft(true);
    const richtig = keys.filter((k) => auswahl[k] === aufgabe.zuordnung[k]).length;
    const b: Bewertung =
      richtig === keys.length ? "richtig" : richtig === 0 ? "falsch" : "teilweise";
    setBewertung(b);
    trefferRueckmeldung(b);
    onErgebnis(b);
  };

  return (
    <div className={pulsKlasse(geprueft, bewertung)}>
      <p className="text-base font-medium">{aufgabe.frage}</p>
      <SafeSvg
        markup={aufgabe.svg}
        className="my-4 flex justify-center rounded-lg border p-3"
      />
      <div className="flex flex-col gap-2">
        {keys.map((k, i) => {
          const ok = geprueft && aufloesen && auswahl[k] === aufgabe.zuordnung[k];
          const falsch = geprueft && aufloesen && auswahl[k] !== aufgabe.zuordnung[k];
          return (
            <div key={k} className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium"
                style={{ background: "var(--accent)", color: "var(--accent-text)" }}
              >
                {i + 1}
              </span>
              <select
                value={auswahl[k] ?? ""}
                onChange={(e) => setAuswahl((p) => ({ ...p, [k]: e.target.value }))}
                disabled={geprueft}
                aria-label={`Bezeichnung für Punkt ${i + 1}`}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: ok ? "var(--ok)" : falsch ? "var(--bad)" : "var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                }}
              >
                <option value="">— wählen —</option>
                {pool.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {falsch && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {aufgabe.zuordnung[k]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {!geprueft ? (
        <button
          onClick={pruefen}
          disabled={keys.some((k) => !auswahl[k])}
          className="mt-4 w-full rounded-xl py-3 font-medium disabled:opacity-40"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {aufloesen ? "Prüfen" : "Antwort abgeben"}
        </button>
      ) : (
        aufloesen && <Erklaerung text={aufgabe.erklaerung} />
      )}
    </div>
  );
}
