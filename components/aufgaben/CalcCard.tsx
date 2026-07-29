"use client";
import { useEffect, useMemo, useState } from "react";
import type { CalcAufgabe, Bewertung, AufgabeModus } from "@/content/schema";
import { wuerfleParameter, berechneSchritte, pruefeAntwort, ersetzePlatzhalter, rechne } from "@/lib/calc";
import { Erklaerung } from "@/components/aufgaben/Erklaerung";
import { Buchbild } from "@/components/aufgaben/Buchbild";
import { trefferRueckmeldung, pulsKlasse } from "@/lib/rueckmeldung";

export function CalcCard({
  aufgabe,
  onErgebnis,
  modus = "uebung",
}: {
  aufgabe: CalcAufgabe;
  onErgebnis: (b: Bewertung) => void;
  modus?: AufgabeModus;
}) {
  const aufloesen = modus === "uebung";
  // Gewürfelte Zahlen pro Aufgabe merken, damit ein Abstecher zum Rechner (und
  // zurück) NICHT neue Zahlen zieht — sonst wäre die schon gerechnete Antwort falsch.
  const KEY = `dd-calc-${aufgabe.id}`;
  const [werte, setWerte] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      try {
        const s = JSON.parse(sessionStorage.getItem(KEY) || "null");
        if (s && aufgabe.parameter.every((p) => typeof s[p.name] === "number")) return s;
      } catch {}
    }
    return wuerfleParameter(aufgabe.parameter);
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(werte));
    } catch {}
  }, [KEY, werte]);
  const [eingabe, setEingabe] = useState("");
  const [geprueft, setGeprueft] = useState(false);

  const schritte = useMemo(() => berechneSchritte(aufgabe.schritte, werte), [aufgabe.schritte, werte]);
  const loesung = schritte[schritte.length - 1];
  const richtig = geprueft && pruefeAntwort(parseFloat(eingabe.replace(",", ".")), loesung.wert, aufgabe.toleranzProzent);

  const pruefen = () => {
    setGeprueft(true);
    const ok = pruefeAntwort(parseFloat(eingabe.replace(",", ".")), loesung.wert, aufgabe.toleranzProzent);
    const b: Bewertung = ok ? "richtig" : "falsch";
    trefferRueckmeldung(b);
    onErgebnis(b);
  };

  const neu = () => {
    setWerte(wuerfleParameter(aufgabe.parameter));
    setEingabe("");
    setGeprueft(false);
  };

  return (
    // `richtig` ist bereits abgeleitet — kein zweiter Zustand für dieselbe Aussage.
    <div className={pulsKlasse(geprueft, geprueft ? (richtig ? "richtig" : "falsch") : null)}>
      <p className="text-[17px] font-medium leading-relaxed">
        {ersetzePlatzhalter(aufgabe.aufgabentext, werte)}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !geprueft && eingabe.trim() !== "") pruefen();
          }}
          disabled={geprueft}
          placeholder="Ergebnis"
          aria-label="Ergebnis"
          className="w-40 rounded-lg border px-3 py-2 text-lg"
          style={{
            borderColor:
              geprueft && aufloesen ? (richtig ? "var(--ok)" : "var(--bad)") : "var(--border)",
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
            {aufloesen ? "Prüfen" : "Antwort abgeben"}
          </button>
          {aufloesen && (
            <button
              onClick={neu}
              className="min-h-14 rounded-xl border px-4 py-3 text-[15px]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Neue Zahlen
            </button>
          )}
        </div>
      ) : aufloesen ? (
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
          <Erklaerung text={aufgabe.erklaerung} />
          {aufgabe.bildDatei && (
            <Buchbild datei={aufgabe.bildDatei} unterschrift={aufgabe.bildunterschrift} />
          )}
        </div>
      ) : null}

      {!geprueft && <NebenRechner onUebernehmen={setEingabe} />}
    </div>
  );
}

// Kleiner Rechner direkt in der Aufgabe — so muss man zum Rechnen nicht mehr
// die Seite wechseln. Die große Rechner-Seite bleibt zusätzlich bestehen.
function NebenRechner({ onUebernehmen }: { onUebernehmen: (wert: string) => void }) {
  const [ausdruck, setAusdruck] = useState("");
  const ergebnis = rechne(ausdruck);
  return (
    <div
      className="mt-5 rounded-[var(--r-md)] border p-3"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 3h12v18H6zM9 7h6M8 11h1m3 0h1m3 0h1M8 15h1m3 0h1m3 0h1" />
        </svg>
        Nebenrechnung
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={ausdruck}
          onChange={(e) => setAusdruck(e.target.value)}
          placeholder="z. B. 6.2 / 0.4"
          aria-label="Nebenrechnung"
          className="min-h-14 min-w-0 flex-1 rounded-lg border px-3 py-2 text-[17px]"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
        />
        <span className="tnum shrink-0 text-base font-semibold" style={{ color: ergebnis !== null ? "var(--accent)" : "var(--text-muted)" }}>
          = {ergebnis !== null ? Number(ergebnis.toFixed(4)) : "—"}
        </span>
      </div>
      {ergebnis !== null && (
        <button
          onClick={() => onUebernehmen(String(Number(ergebnis.toFixed(4))))}
          className="mt-2 min-h-14 w-full rounded-lg border py-2 text-[15px] font-medium"
          style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)", color: "var(--accent)" }}
        >
          → ins Ergebnis übernehmen
        </button>
      )}
    </div>
  );
}
