import type { Aufgabe, AufgabenFortschritt } from "@/content/schema";

export function erklaereLernplan(aufgaben: Aufgabe[], fortschritt: Record<string, AufgabenFortschritt>, jetzt: number) {
  const gruppen = new Map<string, { lernfeld: string; thema: string; neu: number; faellig: number; freiwillig: number }>();
  for (const a of aufgaben) {
    const key = `${a.lernfeld}:${a.thema}`;
    const g = gruppen.get(key) ?? { lernfeld: a.lernfeld, thema: a.thema, neu: 0, faellig: 0, freiwillig: 0 };
    const f = fortschritt[a.id];
    if (!f) g.neu++;
    else if (f.faelligAm <= jetzt) g.faellig++;
    else g.freiwillig++;
    gruppen.set(key, g);
  }
  return [...gruppen.values()];
}
