import lernfelderData from "@/content/lernfelder.json";
import lf01Aufgaben from "@/content/lf01/aufgaben.json";
import lf01Lektionen from "@/content/lf01/lektionen.json";
import lf02Aufgaben from "@/content/lf02/aufgaben.json";
import lf02Lektionen from "@/content/lf02/lektionen.json";
import lf03Aufgaben from "@/content/lf03/aufgaben.json";
import lf03Lektionen from "@/content/lf03/lektionen.json";
import lf04Aufgaben from "@/content/lf04/aufgaben.json";
import lf04Lektionen from "@/content/lf04/lektionen.json";
import lf05Aufgaben from "@/content/lf05/aufgaben.json";
import lf05Lektionen from "@/content/lf05/lektionen.json";
import lf06Aufgaben from "@/content/lf06/aufgaben.json";
import lf06Lektionen from "@/content/lf06/lektionen.json";
import lf07Aufgaben from "@/content/lf07/aufgaben.json";
import lf07Lektionen from "@/content/lf07/lektionen.json";
import lf08Aufgaben from "@/content/lf08/aufgaben.json";
import lf08Lektionen from "@/content/lf08/lektionen.json";
import lf09Aufgaben from "@/content/lf09/aufgaben.json";
import lf09Lektionen from "@/content/lf09/lektionen.json";
import lf10Aufgaben from "@/content/lf10/aufgaben.json";
import lf10Lektionen from "@/content/lf10/lektionen.json";
import lf11Aufgaben from "@/content/lf11/aufgaben.json";
import lf11Lektionen from "@/content/lf11/lektionen.json";
import lf12Aufgaben from "@/content/lf12/aufgaben.json";
import lf12Lektionen from "@/content/lf12/lektionen.json";
import lf13aAufgaben from "@/content/lf13a/aufgaben.json";
import lf13aLektionen from "@/content/lf13a/lektionen.json";
import lf13bAufgaben from "@/content/lf13b/aufgaben.json";
import lf13bLektionen from "@/content/lf13b/lektionen.json";
import lf14Aufgaben from "@/content/lf14/aufgaben.json";
import lf14Lektionen from "@/content/lf14/lektionen.json";
import lf15Aufgaben from "@/content/lf15/aufgaben.json";
import lf15Lektionen from "@/content/lf15/lektionen.json";
import lf16Aufgaben from "@/content/lf16/aufgaben.json";
import lf16Lektionen from "@/content/lf16/lektionen.json";
import lf17Aufgaben from "@/content/lf17/aufgaben.json";
import lf17Lektionen from "@/content/lf17/lektionen.json";
import wisoAufgaben from "@/content/wiso/aufgaben.json";
import wisoLektionen from "@/content/wiso/lektionen.json";
import { istSichtbar, type Aufgabe, type Lektion, type Lernfeld } from "@/content/schema";

// Neues Lernfeld ergänzen: oben importieren und hier eintragen.
const INHALTE: Record<string, { aufgaben: unknown[]; lektionen: unknown[] }> = {
  lf01: { aufgaben: lf01Aufgaben, lektionen: lf01Lektionen },
  lf02: { aufgaben: lf02Aufgaben, lektionen: lf02Lektionen },
  lf03: { aufgaben: lf03Aufgaben, lektionen: lf03Lektionen },
  lf04: { aufgaben: lf04Aufgaben, lektionen: lf04Lektionen },
  lf05: { aufgaben: lf05Aufgaben, lektionen: lf05Lektionen },
  lf06: { aufgaben: lf06Aufgaben, lektionen: lf06Lektionen },
  lf07: { aufgaben: lf07Aufgaben, lektionen: lf07Lektionen },
  lf08: { aufgaben: lf08Aufgaben, lektionen: lf08Lektionen },
  lf09: { aufgaben: lf09Aufgaben, lektionen: lf09Lektionen },
  lf10: { aufgaben: lf10Aufgaben, lektionen: lf10Lektionen },
  lf11: { aufgaben: lf11Aufgaben, lektionen: lf11Lektionen },
  lf12: { aufgaben: lf12Aufgaben, lektionen: lf12Lektionen },
  lf13a: { aufgaben: lf13aAufgaben, lektionen: lf13aLektionen },
  lf13b: { aufgaben: lf13bAufgaben, lektionen: lf13bLektionen },
  lf14: { aufgaben: lf14Aufgaben, lektionen: lf14Lektionen },
  lf15: { aufgaben: lf15Aufgaben, lektionen: lf15Lektionen },
  lf16: { aufgaben: lf16Aufgaben, lektionen: lf16Lektionen },
  lf17: { aufgaben: lf17Aufgaben, lektionen: lf17Lektionen },
  wiso: { aufgaben: wisoAufgaben, lektionen: wisoLektionen },
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
