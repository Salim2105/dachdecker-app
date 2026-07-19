import lernfelderData from "@/content/lernfelder.json";
import lf01Aufgaben from "@/content/lf01/aufgaben.json";
import lf01Lektionen from "@/content/lf01/lektionen.json";
import lf02Aufgaben from "@/content/lf02/aufgaben.json";
import lf02Lektionen from "@/content/lf02/lektionen.json";
import lf03Aufgaben from "@/content/lf03/aufgaben.json";
import lf03Lektionen from "@/content/lf03/lektionen.json";
import { istSichtbar, type Aufgabe, type Lektion, type Lernfeld } from "@/content/schema";

const AUFGABEN: Record<string, unknown[]> = {
  lf01: lf01Aufgaben,
  lf02: lf02Aufgaben,
  lf03: lf03Aufgaben,
};
const LEKTIONEN: Record<string, unknown[]> = {
  lf01: lf01Lektionen,
  lf02: lf02Lektionen,
  lf03: lf03Lektionen,
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
  return filterSichtbar((AUFGABEN[lfId] as Aufgabe[]) ?? []);
}

export function getLektionen(lfId: string): Lektion[] {
  return filterSichtbar((LEKTIONEN[lfId] as Lektion[]) ?? []);
}
