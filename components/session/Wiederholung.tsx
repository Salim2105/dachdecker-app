"use client";
import { useState } from "react";
import type { Aufgabe, Bewertung } from "@/content/schema";
import { AufgabeSwitch } from "@/components/session/AufgabeSwitch";
import { useProgress } from "@/components/useProgress";

/**
 * Geht eine feste Liste von Aufgaben im Übungsmodus durch — mit voller
 * Auflösung. Genutzt für die Nachbereitung nach einer Prüfung und für die
 * fälligen Wiederholungen im Fortschritt.
 */
export function Wiederholung({
  aufgaben,
  titel,
  onFertig,
}: {
  aufgaben: Aufgabe[];
  titel: string;
  onFertig: () => void;
}) {
  const { bewerte } = useProgress();
  const [index, setIndex] = useState(0);
  const [beantwortet, setBeantwortet] = useState(false);
  const aktuell = aufgaben[index];

  if (!aktuell) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium">{titel}</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {index + 1} / {aufgaben.length}
        </span>
      </div>

      <AufgabeSwitch
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
            if (index < aufgaben.length - 1) {
              setIndex((i) => i + 1);
              setBeantwortet(false);
            } else {
              onFertig();
            }
          }}
          className="mt-6 w-full rounded-xl py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {index < aufgaben.length - 1 ? "Weiter" : "Fertig"}
        </button>
      )}

      <button
        onClick={onFertig}
        className="mt-3 w-full rounded-xl py-2 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        Abbrechen
      </button>
    </div>
  );
}
