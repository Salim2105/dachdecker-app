export type ClozeTeil =
  | { type: "text"; value: string }
  | { type: "gap"; antwort: string; index: number };

export function parseCloze(text: string): ClozeTeil[] {
  const teile: ClozeTeil[] = [];
  const regex = /\{\{(.+?)\}\}/g;
  let last = 0;
  let gapIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      teile.push({ type: "text", value: text.slice(last, match.index) });
    }
    teile.push({ type: "gap", antwort: match[1].trim(), index: gapIndex++ });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    teile.push({ type: "text", value: text.slice(last) });
  }
  return teile;
}

function normalisiere(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ") // Satzzeichen/Bindestriche egal
    .trim();
}

// Levenshtein-Abstand für Tippfehler-Toleranz.
function abstand(a: string, b: string): number {
  const zeile = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let vorher = zeile[0];
    zeile[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = zeile[j];
      zeile[j] = Math.min(
        zeile[j] + 1,
        zeile[j - 1] + 1,
        vorher + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      vorher = temp;
    }
  }
  return zeile[b.length];
}

/**
 * Richtig, wenn die Eingabe einem der Zielwörter entspricht — Groß/Klein,
 * Umlaut-Schreibweise und Satzzeichen egal, plus Toleranz für kleine Tippfehler.
 * Inhaltlich andere, aber korrekte Wörter kommen über `alternativen` (Feld
 * `akzeptiert` in den Aufgaben) dazu — die kann kein Abgleich erraten.
 */
export function pruefeLuecke(eingabe: string, antwort: string, alternativen: string[] = []): boolean {
  const e = normalisiere(eingabe);
  if (!e) return false;
  return [antwort, ...alternativen].some((z) => {
    const ziel = normalisiere(z);
    const erlaubt = ziel.length <= 4 ? 1 : 2; // längere Wörter: mehr Spielraum
    return e === ziel || abstand(e, ziel) <= erlaubt;
  });
}
