/**
 * Zerlegt einen Fließtext in Sätze.
 *
 * Der naive Schnitt an ".!?" trennt deutsche Fachtexte an den falschen Stellen:
 * "z. B.", "S. 497" und Ordnungszahlen wie "19. Jahrhundert" oder
 * "1. Rohstoff-Abbau" enden alle auf einen Punkt, ohne dass der Satz zu Ende
 * wäre. Gegen den echten Aufgabenbestand geprüft — die Fälle, die dabei
 * auffielen, stehen als Tests in lib/__tests__/saetze.test.ts.
 *
 * Formeln bleiben bewusst eigene "Sätze" ("R = d/λ.", "S = ½ · (H − Ü)."):
 * eine Formel auf eigener Zeile ist lesbarer als eine im Absatz vergrabene.
 */

/**
 * Endet der Text vor einer Kandidatengrenze so, dass der Punkt KEIN Satzende
 * ist? Die Vorbedingung `(?:^|[\s(\[„"])` ist entscheidend:
 *
 * - ohne sie passt `[A-Za-z]\.` auf den letzten Buchstaben jedes beliebigen
 *   Wortes ("berechnet."), und der ganze Text verschmilzt zu einem Satz;
 * - mit nur `\s` bleibt die Klammer offen: "(z. B. OK Rohdecke)" wird nach
 *   "(z." getrennt, weil davor eine Klammer steht und kein Leerzeichen.
 */
const KEIN_SATZENDE =
  /(?:^|[\s(\[„"])(?:ca|bzw|ggf|usw|vgl|Nr|Abb|Tab|Bsp|inkl|max|min|evtl|Art|Abs|Kap|sog|etc|\d+|[A-Za-zÄÖÜäöü])\.$/;

export function saetze(text: string): string[] {
  const t = text.trim();
  const raus: string[] = [];
  let start = 0;

  // Grenzen einzeln prüfen statt erst zu zerlegen und dann wieder zu kleben:
  // Beim Zusammenkleben würde der komplette Rest angehängt — inklusive
  // echter Satzgrenzen, die darin noch stecken ("19. Jahrhundert. Sie …").
  const grenzen = /(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9])/g;
  for (let m = grenzen.exec(t); m !== null; m = grenzen.exec(t)) {
    const kandidat = t.slice(start, m.index);
    if (KEIN_SATZENDE.test(kandidat)) continue;
    raus.push(kandidat);
    start = m.index + m[0].length;
  }
  raus.push(t.slice(start));

  return raus.filter((s) => s.length > 0);
}
