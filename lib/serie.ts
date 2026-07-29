import type { AufgabenFortschritt } from "@/content/schema";

const TAG = 86_400_000;

/** Kalendertag als Zahl — lokale Zeitzone, denn "gestern" ist gefühlt, nicht UTC. */
function tagesnummer(ms: number): number {
  const d = new Date(ms);
  return Math.floor((ms - d.getTimezoneOffset() * 60_000) / TAG);
}

/**
 * Tage in Folge, an denen geübt wurde.
 *
 * Bewusst eine REINE ABLEITUNG aus dem vorhandenen Fortschritt: kein eigener
 * Speicherplatz, kein zweiter Schreibpfad, nichts, was mit der Vergessenskurve
 * kollidieren könnte. Der Rat hat Streaks nur unter genau dieser Bedingung
 * freigegeben — eine Serie, die selbst etwas speichert, wäre ein zweiter
 * Kanal neben `bewertung` und damit ein Goodhart-Kanal.
 *
 * Gezählt wird ANWESENHEIT, nicht Erfolg. "Du warst da" ist nicht fälschbar in
 * der Weise, in der "ich wusste es" fälschbar ist — deshalb ist das die einzige
 * Serie, die hier ehrlich sein kann.
 *
 * Kulanz für heute: Wer heute noch nicht geübt hat, verliert die Serie nicht —
 * der Tag ist ja noch nicht vorbei. Gezählt wird dann ab gestern.
 *
 * Grenze, die man kennen muss: `gesehenAm` wird pro Aufgabe ÜBERSCHRIEBEN
 * (lib/progress.ts). Wer eine Aufgabe von vor drei Wochen heute wiederholt,
 * löscht damit deren alten Zeitstempel. Weit zurückliegende Tage können so
 * verblassen; die letzten Tage sind zuverlässig, weil nie alle Aufgaben eines
 * Tages am selben späteren Tag wiederholt werden.
 */
export function serie(
  fortschritt: Record<string, AufgabenFortschritt>,
  jetzt: number = Date.now(),
): number {
  const tage = new Set<number>();
  for (const f of Object.values(fortschritt)) {
    if (typeof f?.gesehenAm === "number") tage.add(tagesnummer(f.gesehenAm));
  }
  if (tage.size === 0) return 0;

  const heute = tagesnummer(jetzt);
  let tag = tage.has(heute) ? heute : tage.has(heute - 1) ? heute - 1 : null;
  if (tag === null) return 0;

  let laenge = 0;
  while (tage.has(tag)) {
    laenge++;
    tag--;
  }
  return laenge;
}
