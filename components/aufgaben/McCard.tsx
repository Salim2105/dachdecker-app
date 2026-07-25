"use client";
import { useState } from "react";
import type { McAufgabe, Bewertung, AufgabeModus } from "@/content/schema";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";
import { Buchbild } from "@/components/aufgaben/Buchbild";

export function McCard({
  aufgabe,
  onErgebnis,
  modus = "uebung",
}: {
  aufgabe: McAufgabe;
  onErgebnis: (b: Bewertung) => void;
  modus?: AufgabeModus;
}) {
  const aufloesen = modus === "uebung";
  const mehrfach = aufgabe.korrekt.length > 1;
  const [gewaehlt, setGewaehlt] = useState<Set<number>>(new Set());
  const [geprueft, setGeprueft] = useState(false);

  const toggle = (i: number) => {
    if (geprueft) return;
    setGewaehlt((prev) => {
      const next = new Set(mehrfach ? prev : []);
      if (prev.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const pruefen = () => {
    setGeprueft(true);
    const korrektSet = new Set(aufgabe.korrekt);
    const gleich =
      gewaehlt.size === korrektSet.size && [...gewaehlt].every((i) => korrektSet.has(i));
    onErgebnis(gleich ? "richtig" : "falsch");
  };

  const stilFuer = (i: number) => {
    if (!geprueft || !aufloesen) {
      return gewaehlt.has(i)
        ? { borderColor: "var(--accent)", background: "var(--surface-2)" }
        : { borderColor: "var(--border)", background: "var(--surface)" };
    }
    const istKorrekt = aufgabe.korrekt.includes(i);
    if (istKorrekt) return { borderColor: "var(--ok)", background: "var(--surface-2)" };
    if (gewaehlt.has(i)) return { borderColor: "var(--bad)", background: "var(--surface-2)" };
    return { borderColor: "var(--border)", background: "var(--surface)" };
  };

  return (
    <div>
      <p className="text-base font-medium">{aufgabe.frage}</p>
      {mehrfach && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Mehrfachauswahl möglich
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {aufgabe.optionen.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            disabled={geprueft}
            className="rounded-lg border p-3 text-left text-sm"
            style={{ ...stilFuer(i), color: "var(--text)" }}
          >
            {opt}
          </button>
        ))}
      </div>
      {!geprueft ? (
        <button
          onClick={pruefen}
          disabled={gewaehlt.size === 0}
          className="mt-4 w-full rounded-xl py-3 font-medium disabled:opacity-40"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {aufloesen ? "Prüfen" : "Antwort abgeben"}
        </button>
      ) : (
        aufloesen && (
          <>
            <Erklaerung text={aufgabe.erklaerung} />
            {aufgabe.bildDatei && (
              <Buchbild datei={aufgabe.bildDatei} unterschrift={aufgabe.bildunterschrift} />
            )}
          </>
        )
      )}
    </div>
  );
}
