import type { Aufgabe } from "@/content/schema";

export const LERNZEITEN = [5, 15, 30] as const;
export function schaetzeSekunden(a: Aufgabe): number {
  switch (a.typ) {
    case "mc": return 90;
    case "fachbegriff": return 60;
    case "cloze": return 90;
    case "diagram": return 120;
    case "draw": return 300;
    case "calc": return 90 + a.schritte.length * 60;
  }
}

/** Zeit für Erklärungen und Nacharbeit freihalten; keine laufende Stoppuhr. */
export function zeitAuswahl(aufgaben: Aufgabe[], minuten: number): Aufgabe[] {
  const budget = Math.max(1, minuten) * 60 * 0.8;
  const auswahl: Aufgabe[] = [];
  let sekunden = 0;
  for (const a of aufgaben) {
    const dauer = schaetzeSekunden(a);
    if (sekunden + dauer <= budget) {
      auswahl.push(a);
      sekunden += dauer;
    }
  }
  // Auch eine einzelne längere Aufgabe ist sinnvoller als eine leere Runde.
  return auswahl.length ? auswahl : aufgaben.slice(0, 1);
}
