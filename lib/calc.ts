import { evaluate } from "mathjs";
import type { CalcParameter, CalcSchritt } from "@/content/schema";

export interface BerechneterSchritt {
  name: string;
  beschreibung: string;
  formel: string;
  wert: number;
  einheit: string;
}

function rundeAufSchritt(wert: number, schritt: number): number {
  const dez = (String(schritt).split(".")[1] || "").length;
  return Number((Math.round(wert / schritt) * schritt).toFixed(dez));
}

export function wuerfleParameter(parameter: CalcParameter[]): Record<string, number> {
  const werte: Record<string, number> = {};
  for (const p of parameter) {
    const roh = p.min + Math.random() * (p.max - p.min);
    werte[p.name] = Math.min(p.max, Math.max(p.min, rundeAufSchritt(roh, p.schritt)));
  }
  return werte;
}

export function berechneSchritte(
  schritte: CalcSchritt[],
  werte: Record<string, number>,
): BerechneterSchritt[] {
  const scope: Record<string, number> = { ...werte };
  return schritte.map((s) => {
    const wert = Number(evaluate(s.formel, scope));
    scope[s.ergebnisName] = wert;
    return {
      name: s.ergebnisName,
      beschreibung: ersetzePlatzhalter(s.beschreibung, scope),
      formel: s.formel,
      wert: Number(wert.toFixed(2)),
      einheit: s.einheit,
    };
  });
}

export function pruefeAntwort(eingabe: number, loesung: number, toleranzProzent: number): boolean {
  if (!Number.isFinite(eingabe)) return false;
  const toleranz = Math.abs(loesung) * (toleranzProzent / 100);
  return Math.abs(eingabe - loesung) <= toleranz + 1e-9;
}

// Kleiner Taschenrechner für die Nebenrechnung: wertet einen Ausdruck aus,
// gibt null bei leer/ungültig. Nutzt mathjs (schon als Abhängigkeit da).
export function rechne(ausdruck: string): number | null {
  if (!ausdruck.trim()) return null;
  try {
    const r = Number(evaluate(ausdruck));
    return Number.isFinite(r) ? r : null;
  } catch {
    return null;
  }
}

export function ersetzePlatzhalter(text: string, werte: Record<string, number>): string {
  return text.replace(/\{(\w+)\}/g, (voll, name) =>
    name in werte ? String(Number(werte[name].toFixed(2))) : voll,
  );
}
