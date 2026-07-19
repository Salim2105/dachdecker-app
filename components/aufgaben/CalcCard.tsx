"use client";
import { useMemo, useState } from "react";
import type { CalcAufgabe, Bewertung } from "@/content/schema";
import { wuerfleParameter, berechneSchritte, pruefeAntwort, ersetzePlatzhalter } from "@/lib/calc";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";

export function CalcCard({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: CalcAufgabe;
  onErgebnis: (b: Bewertung) => void;
}) {
  const [werte, setWerte] = useState<Record<string, number>>(() =>
    wuerfleParameter(aufgabe.parameter),
  );
  const [eingabe, setEingabe] = useState("");
  const [geprueft, setGeprueft] = useState(false);

  const schritte = useMemo(() => berechneSchritte(aufgabe.schritte, werte), [aufgabe.schritte, werte]);
  const loesung = schritte[schritte.length - 1];
  const richtig = geprueft && pruefeAntwort(parseFloat(eingabe.replace(",", ".")), loesung.wert, aufgabe.toleranzProzent);

  const pruefen = () => {
    setGeprueft(true);
    const ok = pruefeAntwort(parseFloat(eingabe.replace(",", ".")), loesung.wert, aufgabe.toleranzProzent);
    onErgebnis(ok ? "richtig" : "falsch");
  };

  const neu = () => {
    setWerte(wuerfleParameter(aufgabe.parameter));
    setEingabe("");
    setGeprueft(false);
  };

  return (
    <div>
      <p className="text-base font-medium leading-relaxed">
        {ersetzePlatzhalter(aufgabe.aufgabentext, werte)}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          disabled={geprueft}
          placeholder="Ergebnis"
          aria-label="Ergebnis"
          className="w-40 rounded-lg border px-3 py-2 text-lg"
          style={{
            borderColor: geprueft ? (richtig ? "var(--ok)" : "var(--bad)") : "var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
          }}
        />
        <span style={{ color: "var(--text-muted)" }}>{loesung.einheit}</span>
      </div>

      {!geprueft ? (
        <div className="mt-4 flex gap-2">
          <button
            onClick={pruefen}
            disabled={eingabe.trim() === ""}
            className="flex-1 rounded-xl py-3 font-medium disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            Prüfen
          </button>
          <button
            onClick={neu}
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Neue Zahlen
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm font-medium" style={{ color: richtig ? "var(--ok)" : "var(--bad)" }}>
            {richtig ? "Richtig!" : `Richtige Lösung: ${loesung.wert} ${loesung.einheit}`}
          </p>
          <div
            className="mt-3 rounded-lg border p-3"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Lösungsweg
            </p>
            <ol className="flex flex-col gap-2 text-sm">
              {schritte.map((s, i) => (
                <li key={i}>
                  <span style={{ color: "var(--text-muted)" }}>{s.beschreibung}</span>
                  <br />
                  <span style={{ color: "var(--text)" }}>
                    = {s.wert} {s.einheit}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <Erklaerung text={aufgabe.erklaerung} quelle={aufgabe.quelle} />
        </div>
      )}
    </div>
  );
}
