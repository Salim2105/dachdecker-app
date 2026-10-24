import { getAufgaben, getLektionen, getLernfeld } from "@/lib/content";
import { findeBegriffe } from "@/lib/glossar";
import { LF7_KAPITEL } from "@/content/lf07/lernwerkstatt";
import verknuepfungen from "@/content/curriculum-verknuepfungen.json";
import type { Aktivitaet } from "@/lib/aktivitaeten";

export interface LernIllustration {
  art: "wasserweg" | "rinne" | "regen" | "ablauf" | "montage" | "abwicklung";
  beschriftung: string;
}
export interface LernEinheit {
  id: string; version: number; titel: string; lernziel: string; minuten: number;
  textschritte: string[]; lektionIds: string[]; aufgabenIds: string[]; begriffe: string[];
  abrufFrage: string; abrufMuster: string; aktivitaet?: Aktivitaet; illustration?: LernIllustration;
}
export interface LernKapitel { id: string; titel: string; einheiten: LernEinheit[] }
export interface LernCurriculum { lfId: string; titel: string; redaktionell: boolean; kapitel: LernKapitel[] }
const mapping: Record<string, string[]> = verknuepfungen;

/** Text is split at sentence boundaries; the original reference remains accessible. */
export function teileLerntext(abschnitte: string[], maximal = 150): string[] {
  const saetze = abschnitte.flatMap((p) => p.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? [p]);
  const out: string[] = [];
  let block: string[] = [];
  let anzahl = 0;
  for (const satz of saetze) {
    const woerter = satz.trim().split(/\s+/);
    if (anzahl && anzahl + woerter.length > maximal) { out.push(block.join(" ").trim()); block = []; anzahl = 0; }
    while (woerter.length > maximal) out.push(woerter.splice(0, maximal).join(" "));
    block.push(woerter.join(" ")); anzahl += woerter.length;
  }
  if (anzahl) out.push(block.join(" ").trim());
  return out.filter(Boolean);
}

const cache = new Map<string, LernCurriculum>();
export function getCurriculum(lfId: string): LernCurriculum | null {
  if (cache.has(lfId)) return cache.get(lfId)!;
  const lf = getLernfeld(lfId);
  if (!lf) return null;
  if (lfId === "lf07") {
    const kurs = { lfId, titel: lf.titel, redaktionell: true, kapitel: LF7_KAPITEL };
    cache.set(lfId, kurs); return kurs;
  }
  const lektionen = getLektionen(lfId);
  const verfuegbar = new Set(getAufgaben(lfId).map((a) => a.id));
  const kapitel: LernKapitel[] = [];
  for (let index = 0; index < lektionen.length; index++) {
    const lektion = lektionen[index];
    const kapitelIndex = Math.floor(index / 3);
    if (!kapitel[kapitelIndex]) kapitel.push({ id: `${lfId}-k${String(kapitelIndex + 1).padStart(2, "0")}`, titel: lektion.thema, einheiten: [] });
    const text = teileLerntext(lektion.inhalt);
    for (let schritt = 0; schritt < text.length; schritt += 2) {
      const teil = text.slice(schritt, schritt + 2);
      kapitel[kapitelIndex].einheiten.push({
        id: `${lektion.id}-e${String(schritt / 2 + 1).padStart(2, "0")}`, version: 1,
        titel: `${lektion.titel}${text.length > 2 ? ` · Teil ${schritt / 2 + 1}` : ""}`,
        lernziel: `Du kannst die Kernaussagen zu „${lektion.titel}“ mit eigenen Worten erklären und auf eine Aufgabe anwenden.`,
        minuten: 8, textschritte: teil, lektionIds: [lektion.id],
        aufgabenIds: (mapping[lektion.id] ?? []).filter((id) => verfuegbar.has(id)),
        begriffe: findeBegriffe(teil.join(" ")).map((b) => b.id),
        abrufFrage: `Erkläre die wichtigste Aussage zu „${lektion.titel}“. Nenne eine Anwendung auf der Baustelle.`,
        abrufMuster: teil[0],
      });
    }
  }
  const kurs = { lfId, titel: lf.titel, redaktionell: false, kapitel };
  cache.set(lfId, kurs); return kurs;
}
