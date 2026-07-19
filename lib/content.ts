import lernfelderData from "@/content/lernfelder.json";
import lf01Aufgaben from "@/content/lf01/aufgaben.json";
import lf01Lektionen from "@/content/lf01/lektionen.json";
import lf02Aufgaben from "@/content/lf02/aufgaben.json";
import lf02Lektionen from "@/content/lf02/lektionen.json";
import lf03Aufgaben from "@/content/lf03/aufgaben.json";
import lf03Lektionen from "@/content/lf03/lektionen.json";
import lf04Aufgaben from "@/content/lf04/aufgaben.json";
import lf04Lektionen from "@/content/lf04/lektionen.json";
import { istSichtbar, type Aufgabe, type Lektion, type Lernfeld } from "@/content/schema";

// Neues Lernfeld ergänzen: oben importieren und hier eintragen.
const INHALTE: Record<string, { aufgaben: unknown[]; lektionen: unknown[] }> = {
  lf01: { aufgaben: lf01Aufgaben, lektionen: lf01Lektionen },
  lf02: { aufgaben: lf02Aufgaben, lektionen: lf02Lektionen },
  lf03: { aufgaben: lf03Aufgaben, lektionen: lf03Lektionen },
  lf04: { aufgaben: lf04Aufgaben, lektionen: lf04Lektionen },
};

export function filterSichtbar<T extends { konfidenz: Lektion["konfidenz"] }>(xs: T[]): T[] {
  return xs.filter(istSichtbar);
}

export function getLernfelder(): Lernfeld[] {
  return (lernfelderData as { lernfelder: Lernfeld[] }).lernfelder;
}

export function getLernfeld(id: string): Lernfeld | undefined {
  return getLernfelder().find((lf) => lf.id === id);
}

export function getAufgaben(lfId: string): Aufgabe[] {
  return filterSichtbar((INHALTE[lfId]?.aufgaben as Aufgabe[]) ?? []);
}

export function getLektionen(lfId: string): Lektion[] {
  return filterSichtbar((INHALTE[lfId]?.lektionen as Lektion[]) ?? []);
}
