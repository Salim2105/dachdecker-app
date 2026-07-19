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
  return s.trim().toLowerCase();
}

export function pruefeLuecke(eingabe: string, antwort: string, alternativen: string[] = []): boolean {
  const ziel = [antwort, ...alternativen].map(normalisiere);
  return ziel.includes(normalisiere(eingabe));
}
