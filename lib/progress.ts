import type { AufgabenFortschritt, Bewertung } from "@/content/schema";

const KEY = "fortschritt-v1";
const TAG = 86_400_000;

export function naechsteFaelligkeit(b: Bewertung, intervallTage: number) {
  const next =
    b === "falsch"
      ? 1
      : b === "teilweise"
        ? Math.max(1, intervallTage)
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

export function lernfeldFortschritt(_lfId: string, aufgabeIds: string[]): number {
  if (aufgabeIds.length === 0) return 0;
  const all = ladeFortschritt();
  const done = aufgabeIds.filter((id) => all[id] && all[id].bewertung !== "falsch").length;
  return done / aufgabeIds.length;
}
