// Metadaten der Lernfelder — Titel, Lehrjahr, Aufgabenzahl. Ohne Aufgaben.
//
// Bewusst getrennt von lib/content.ts: Startseite und Navigation zeigen Namen
// und Zahlen, brauchen aber keine einzige Aufgabe. Wer dafür lib/content.ts
// importiert, zieht die gesamte Aufgabensammlung ins Bundle.
import lernfelderData from "@/content/lernfelder.json";
import anzahl from "@/content/anzahl.json";
import type { Lernfeld } from "@/content/schema";

export function getLernfelder(): Lernfeld[] {
  return (lernfelderData as { lernfelder: Lernfeld[] }).lernfelder;
}

export function getLernfeld(id: string): Lernfeld | undefined {
  return getLernfelder().find((lf) => lf.id === id);
}

/** Anzahl sichtbarer Aufgaben eines Lernfelds, ohne sie zu laden. */
export function anzahlAufgaben(lfId: string): number {
  return (anzahl.proLernfeld as Record<string, number>)[lfId] ?? 0;
}
