"use client";
import { useState } from "react";
import type { McAufgabe, Bewertung, AufgabeModus } from "@/content/schema";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";
import { Buchbild } from "@/components/aufgaben/Buchbild";
import { trefferRueckmeldung, pulsKlasse } from "@/lib/rueckmeldung";

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
  const [bewertung, setBewertung] = useState<Bewertung | null>(null);

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
    const b: Bewertung = gleich ? "richtig" : "falsch";
    setBewertung(b);
    trefferRueckmeldung(b);
    onErgebnis(b);
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
    <div className={pulsKlasse(geprueft, bewertung)}>
      <p className="text-[17px] font-medium">{aufgabe.frage}</p>
      {/* In der Übung steht die Anzahl da, in der Prüfungssimulation nicht.
          "Mehrfachauswahl möglich" lässt offen, ob zwei oder drei Antworten
          stimmen — man probiert durch und merkt sich nebenbei, was man schon
          angeklickt hat. Das prüft Aufzählen, nicht Erkennen, und kostet
          Arbeitsgedächtnis, das abends knapp ist. Die Anzahl verrät nicht,
          WELCHE richtig sind: der Abruf bleibt unangetastet.
          In der Simulation bleibt es beim vagen Hinweis — sie soll nicht
          leichter sein als die echte Prüfung. */}
      {mehrfach && (
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {aufloesen ? (
            <>
              <span className="tnum">{aufgabe.korrekt.length}</span> von{" "}
              <span className="tnum">{aufgabe.optionen.length}</span> sind richtig
            </>
          ) : (
            "Mehrfachauswahl möglich"
          )}
        </p>
      )}
      {/* Die ganze Zeile ist die Trefferfläche, mindestens 56 px hoch — mit
          Arbeitshandschuhen trifft niemand ein kleines Kästchen. */}
      <div className="mt-4 flex flex-col gap-2">
        {aufgabe.optionen.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            disabled={geprueft}
            aria-pressed={gewaehlt.has(i)}
            className="flex min-h-14 items-center gap-3 rounded-lg border p-4 text-left text-[17px]"
            style={{ ...stilFuer(i), color: "var(--text)" }}
          >
            {/* Zustand nie allein über Farbe — Sonnenlicht frisst Farbnuancen. */}
            <span
              aria-hidden="true"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border text-[15px] font-bold"
              style={{
                borderColor: gewaehlt.has(i) ? "var(--accent)" : "var(--border)",
                color: "var(--accent)",
              }}
            >
              {gewaehlt.has(i) ? "✓" : ""}
            </span>
            <span className="min-w-0">{opt}</span>
          </button>
        ))}
      </div>
      {!geprueft ? (
        <button
          onClick={pruefen}
          disabled={gewaehlt.size === 0}
          className="mt-4 min-h-14 w-full rounded-xl py-3 text-[17px] font-semibold disabled:opacity-40"
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
