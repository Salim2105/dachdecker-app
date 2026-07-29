"use client";
import { useState } from "react";
import { saetze } from "@/lib/saetze";

/**
 * Zeigt nur die Erklärung. Die Quelle steht weiterhin in den Inhalts-Daten
 * (Feld `quelle`) als Nachweis, wird aber bewusst nicht angezeigt.
 *
 * Der Text kam bisher als ein einziger Block heraus, egal wie lang. Gemessen
 * über alle 2039 Erklärungen: Median 248 Zeichen, 611 über 300, längste 779 —
 * und keine einzige der langen besteht aus nur einem Satz. Das Problem war nie
 * die Wortwahl, sondern die fehlende Pause zwischen den Sätzen.
 */

/** Ab drei Sätzen gegliedert; darunter liest sich ein Block flüssiger. */
const AB_SATZANZAHL = 3;
/**
 * Nur die echten Wände bekommen eine Vorschau — 54 der 2039 Erklärungen sind
 * länger. Alles darunter ist mit Absätzen ohne Aufklappen erfassbar, und was
 * hinter einem Tipp liegt, liest ein müder Mensch abends nicht mehr. Die
 * Erklärung ist der Ertrag der Aufgabe; sie wegzuklappen spart Reibung an der
 * einen Stelle, an der sie hingehört.
 */
const AB_ZEICHEN = 500;
const VORSCHAU_SAETZE = 2;

export function Erklaerung({ text }: { text: string }) {
  const [offen, setOffen] = useState(false);

  const teile = saetze(text);
  const gliedern = teile.length >= AB_SATZANZAHL;
  const kuerzbar = text.length > AB_ZEICHEN && teile.length > VORSCHAU_SAETZE;
  const sichtbar = kuerzbar && !offen ? teile.slice(0, VORSCHAU_SAETZE) : teile;

  return (
    <div
      className="mt-4 flex gap-2.5 rounded-[var(--r-md)] p-3 text-sm leading-relaxed"
      style={{ background: "var(--accent-soft)" }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-0.5 flex-shrink-0"
      >
        <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0012 2z" />
      </svg>
      <div className="min-w-0" style={{ color: "var(--text)" }}>
        {gliedern ? (
          sichtbar.map((satz, i) => (
            <p key={i} className={i > 0 ? "mt-2" : undefined}>
              {satz}
            </p>
          ))
        ) : (
          <p>{text}</p>
        )}
        {kuerzbar && (
          <button
            onClick={() => setOffen((o) => !o)}
            aria-expanded={offen}
            className="mt-2 min-h-9 text-[13px] font-semibold underline"
            style={{ color: "var(--accent)" }}
          >
            {offen ? "Weniger" : "Ganze Erklärung"}
          </button>
        )}
      </div>
    </div>
  );
}
