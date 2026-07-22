"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Aufgabe, Bewertung } from "@/content/schema";
import { AufgabeSwitch } from "@/components/session/AufgabeSwitch";
import { useProgress } from "@/components/useProgress";
import { letztesLfStore } from "@/lib/appStores";

export function SessionRunner({ aufgaben, lfId }: { aufgaben: Aufgabe[]; lfId: string }) {
  const { bewerte } = useProgress();
  const KEY = `dd-session-${lfId}`;
  const [index, setIndex] = useState(0);
  const [beantwortet, setBeantwortet] = useState(false);
  const [ergebnisse, setErgebnisse] = useState<Bewertung[]>([]);
  const [fertig, setFertig] = useState(false);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    letztesLfStore.set(lfId);
  }, [lfId]);

  // Laufende Übung wiederherstellen (z. B. nach Abstecher zum Rechner).
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && typeof s.index === "number" && s.index < aufgaben.length) {
        setIndex(s.index);
        setErgebnisse(Array.isArray(s.ergebnisse) ? s.ergebnisse : []);
        setBeantwortet(!!s.beantwortet);
      }
    } catch {}
    setGeladen(true);
  }, [KEY, aufgaben.length]);

  // Stand sichern; bei Abschluss aufräumen.
  useEffect(() => {
    if (!geladen) return;
    if (fertig) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify({ index, ergebnisse, beantwortet }));
  }, [geladen, KEY, index, ergebnisse, beantwortet, fertig]);

  const aktuell = aufgaben[index];

  const handleErgebnis = (b: Bewertung) => {
    if (beantwortet) return;
    setBeantwortet(true);
    bewerte(aktuell.id, b);
    setErgebnisse((prev) => [...prev, b]);
  };

  const weiter = () => {
    if (index < aufgaben.length - 1) {
      setIndex((i) => i + 1);
      setBeantwortet(false);
    } else {
      setFertig(true);
    }
  };

  if (fertig) {
    const zaehle = (b: Bewertung) => ergebnisse.filter((e) => e === b).length;
    return (
      <div className="text-center">
        <h1 className="text-xl font-medium">Session abgeschlossen</h1>
        <div className="mt-6 flex justify-center gap-3">
          <Stat label="Richtig" wert={zaehle("richtig")} farbe="var(--ok)" />
          <Stat label="Fast" wert={zaehle("teilweise")} farbe="var(--accent)" />
          <Stat label="Nochmal" wert={zaehle("falsch")} farbe="var(--bad)" />
        </div>
        <div className="mt-8 flex flex-col gap-2">
          <button
            onClick={() => {
              setIndex(0);
              setBeantwortet(false);
              setErgebnisse([]);
              setFertig(false);
            }}
            className="rounded-xl py-3 font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            Nochmal üben
          </button>
          <Link
            href={`/lernen/${lfId}`}
            className="rounded-xl border py-3 font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Fertig
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${((index + (beantwortet ? 1 : 0)) / aufgaben.length) * 100}%`, background: "var(--accent)" }}
          />
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {index + 1} / {aufgaben.length}
        </span>
      </div>

      <AufgabeSwitch key={aktuell.id} aufgabe={aktuell} onErgebnis={handleErgebnis} />

      {beantwortet && (
        <button
          onClick={weiter}
          className="mt-6 w-full rounded-xl py-3 font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          {index < aufgaben.length - 1 ? "Weiter" : "Ergebnis anzeigen"}
        </button>
      )}
    </div>
  );
}

function Stat({ label, wert, farbe }: { label: string; wert: number; farbe: string }) {
  return (
    <div className="rounded-xl px-5 py-3" style={{ background: "var(--surface)" }}>
      <div className="text-2xl font-medium" style={{ color: farbe }}>
        {wert}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}
