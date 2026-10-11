import type { Aufgabe, AufgabenFortschritt } from "@/content/schema";

export type LernStatus = "neu" | "unsicher" | "erinnert" | "gefestigt" | "faellig";
export const STATUS_LABEL: Record<LernStatus, string> = {
  neu: "Neu", unsicher: "Unsicher / mit Hilfe", erinnert: "Einmal erinnert",
  gefestigt: "Mehrfach an verschiedenen Tagen erinnert", faellig: "Wiederholung fällig",
};

export function lernStatus(f: AufgabenFortschritt | undefined, jetzt: number): LernStatus {
  if (!f) return "neu";
  if (f.faelligAm <= jetzt) return "faellig";
  const letzter = [...(f.verlauf ?? [])].reverse().find((v) => !v.nachErklaerung) ?? f.verlauf?.at(-1);
  if (f.bewertung !== "richtig" || letzter?.mitHilfe || letzter?.nachErklaerung) return "unsicher";
  const tage = new Set<string>();
  // Ein späterer Fehler beendet die vorherige Erfolgsserie.
  for (const v of [...(f.verlauf ?? [])].reverse()) {
    if (v.bewertung !== "richtig") break;
    if (!v.mitHilfe && !v.nachErklaerung) tage.add(new Date(v.am).toDateString());
  }
  return tage.size >= 3 ? "gefestigt" : "erinnert";
}

export function themenStand(aufgaben: Aufgabe[], fortschritt: Record<string, AufgabenFortschritt>, jetzt: number) {
  const themen = new Map<string, { lernfeld: string; thema: string; aufgaben: Aufgabe[]; zahlen: Record<LernStatus, number> }>();
  for (const a of aufgaben) {
    const key = `${a.lernfeld}:${a.thema}`;
    const e = themen.get(key) ?? {
      lernfeld: a.lernfeld, thema: a.thema, aufgaben: [],
      zahlen: { neu: 0, unsicher: 0, erinnert: 0, gefestigt: 0, faellig: 0 },
    };
    e.aufgaben.push(a);
    e.zahlen[lernStatus(fortschritt[a.id], jetzt)]++;
    themen.set(key, e);
  }
  return [...themen.values()];
}
