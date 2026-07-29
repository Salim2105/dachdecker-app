import type { AufgabenFortschritt, Bewertung } from "@/content/schema";

const KEY = "fortschritt-v1";
const TAG = 86_400_000;

/**
 * Wann kommt die Aufgabe wieder?
 *
 * Drei Äste, drei Wachstumsraten:
 *   falsch     → zurück auf 1 Tag. Nicht gekonnt heißt morgen wieder.
 *   teilweise  → Faktor 1,3. Langsam, aber es WÄCHST.
 *   richtig    → Faktor 2.
 *
 * Der mittlere Ast stand vorher auf `Math.max(1, intervallTage)` und wuchs
 * damit nie. Da der Startwert 0 ist (siehe speichereBewertung), landete jede
 * Aufgabe, die zuerst "teilweise" bekam, dauerhaft auf einem Tag Intervall —
 * sie kam jeden Abend wieder, egal wie oft man sie bearbeitete.
 *
 * Das traf vor allem, wo niemand etwas beschönigen kann: ClozeCard und
 * DiagramCard vergeben "teilweise" AUTOMATISCH bei Teilerfolg. Vier von fünf
 * Lücken richtig war also keine Teilleistung, sondern ein Dauerabo. Und weil
 * lib/reifegrad.ts solche Aufgaben mit 0,5 Punkten zählt, während
 * `tagesdosis()` mit `offen = gesamt − punkte` rechnet, hob jeder ehrliche
 * Teilerfolg zusätzlich die Tagesdosis an.
 */
export function naechsteFaelligkeit(b: Bewertung, intervallTage: number) {
  const next =
    b === "falsch"
      ? 1
      : b === "teilweise"
        ? Math.max(2, Math.round(intervallTage * 1.3 || 2))
        : Math.max(2, Math.round(intervallTage * 2 || 2));
  return { intervallTage: next, faelligAm: Date.now() + next * TAG };
}

export function ladeFortschritt(): Record<string, AufgabenFortschritt> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function speichereBewertung(aufgabeId: string, bewertung: Bewertung) {
  const all = ladeFortschritt();
  const prev = all[aufgabeId]?.intervallTage ?? 0;
  const { intervallTage, faelligAm } = naechsteFaelligkeit(bewertung, prev);
  all[aufgabeId] = { aufgabeId, bewertung, gesehenAm: Date.now(), faelligAm, intervallTage };
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function loescheFortschritt() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

/** Fällig sind nur Aufgaben, die schon einmal bearbeitet wurden. */
export function istFaellig(f: AufgabenFortschritt | undefined, jetzt: number): boolean {
  return f !== undefined && f.faelligAm <= jetzt;
}

export function lernfeldFortschritt(_lfId: string, aufgabeIds: string[]): number {
  if (aufgabeIds.length === 0) return 0;
  const all = ladeFortschritt();
  const done = aufgabeIds.filter((id) => all[id] && all[id].bewertung !== "falsch").length;
  return done / aufgabeIds.length;
}
