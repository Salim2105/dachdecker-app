import type { Aufgabe, Bewertung } from "@/content/schema";
import { getAufgaben, getLernfelder } from "@/lib/content";

/**
 * Nur diese Aufgabentypen werden automatisch bewertet. draw und fachbegriff
 * bewertet man selbst — in einer Prüfung ohne Rückmeldung ginge das nicht.
 */
const AUTO_TYPEN = ["mc", "cloze", "calc", "diagram"];

export function istAutoBewertbar(a: Aufgabe): boolean {
  return AUTO_TYPEN.includes(a.typ);
}

export interface Pruefungsteil {
  id: string;
  titel: string;
  beschreibung: string;
  lernfelder: string[];
  anzahl: number;
  minuten: number;
}

function fachLernfelder(): string[] {
  return getLernfelder()
    .map((lf) => lf.id)
    .filter((id) => id !== "wiso");
}

export function getPruefungsteile(): Pruefungsteil[] {
  const alle = fachLernfelder();
  return [
    {
      id: "teil1",
      titel: "Teil 1 — Zwischenprüfung",
      beschreibung: "Lernfeld 1 bis 9, gemischt. Zählt bei der gestreckten Gesellenprüfung zur Endnote.",
      lernfelder: alle.filter((id) => /^lf0[1-9]$/.test(id)),
      anzahl: 30,
      minuten: 45,
    },
    {
      id: "teil2",
      titel: "Teil 2 — alle Lernfelder",
      beschreibung: "Der gesamte fachliche Stoff: Lernfeld 1 bis 17 und die Anhänge, gemischt.",
      lernfelder: alle,
      anzahl: 40,
      minuten: 60,
    },
    {
      id: "wiso",
      titel: "Wirtschafts- und Sozialkunde",
      beschreibung: "Nur WiSo — eigener Prüfungsbereich in der schriftlichen Prüfung.",
      lernfelder: ["wiso"],
      anzahl: 15,
      minuten: 25,
    },
  ];
}

export function poolFuer(teil: Pruefungsteil): Aufgabe[] {
  return teil.lernfelder.flatMap((id) => getAufgaben(id)).filter(istAutoBewertbar);
}

export function zieheAufgaben<T>(
  pool: T[],
  anzahl: number,
  zufall: () => number = Math.random,
): T[] {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(anzahl, a.length));
}

/** Teilweise richtig zählt einen halben Punkt. */
export function punkteFuer(b: Bewertung): number {
  return b === "richtig" ? 1 : b === "teilweise" ? 0.5 : 0;
}

export function prozentFuer(ergebnisse: Bewertung[], gesamt: number): number {
  if (gesamt === 0) return 0;
  const punkte = ergebnisse.reduce((s, b) => s + punkteFuer(b), 0);
  return (punkte / gesamt) * 100;
}

export interface Notenstufe {
  ab: number;
  note: number;
  text: string;
}

/**
 * Üblicher Bewertungsschlüssel für Prüfungen bei Kammern. Den verbindlichen
 * Schlüssel legt die zuständige Kammer fest — hier zur groben Einordnung.
 */
export const NOTENSCHLUESSEL: Notenstufe[] = [
  { ab: 92, note: 1, text: "sehr gut" },
  { ab: 81, note: 2, text: "gut" },
  { ab: 67, note: 3, text: "befriedigend" },
  { ab: 50, note: 4, text: "ausreichend" },
  { ab: 30, note: 5, text: "mangelhaft" },
  { ab: 0, note: 6, text: "ungenügend" },
];

export function noteFuer(prozent: number): Notenstufe {
  return NOTENSCHLUESSEL.find((n) => prozent >= n.ab) ?? NOTENSCHLUESSEL[NOTENSCHLUESSEL.length - 1];
}

export function bestanden(prozent: number): boolean {
  return prozent >= 50;
}

export function formatiereZeit(sekunden: number): string {
  const s = Math.max(0, Math.floor(sekunden));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
