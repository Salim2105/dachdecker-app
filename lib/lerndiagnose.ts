import { appStorage } from "@/lib/lernSpeicher";

export type LernKategorie = "einheiten" | "formel" | "rechenweg" | "begriffe" | "leseverstehen" | "englisch" | "fachwissen";
export interface LernSignal {
  id: string; am: number; quelle: "mathe" | "deutsch" | "englisch" | "fachwissen" | "einstieg";
  aufgabeId: string; lernzielId: string; richtig: boolean; selbstBewertet?: boolean;
  kategorie: LernKategorie; hilfen: string[]; route: string; thema: string;
}
export const DIAGNOSE_KEY = "lernhinweise-v1";
const kategorien = ["einheiten", "formel", "rechenweg", "begriffe", "leseverstehen", "englisch", "fachwissen"];
const istObjekt = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const istText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
/** Only known local learning destinations can be restored from an imported file. */
function istLernRoute(v: unknown): v is string {
  return typeof v === "string" && /^\/(?:lernen(?:\/[a-zA-Z0-9_-]+)?|grundlagen\/mathe|sprache\/(?:deutsch|englisch)|lernhilfe)(?:#[a-zA-Z0-9_-]+)?$/.test(v);
}
export function leseLernsignale(text: string | null): LernSignal[] {
  try {
    const values: unknown = JSON.parse(text ?? "[]");
    if (!Array.isArray(values)) return [];
    const gueltig = values.filter((v) => istObjekt(v) &&
      ["id", "aufgabeId", "lernzielId", "thema"].every((k) => istText(v[k])) && istLernRoute(v.route) &&
      typeof v.quelle === "string" && ["mathe", "deutsch", "englisch", "fachwissen", "einstieg"].includes(v.quelle) &&
      typeof v.am === "number" && Number.isFinite(v.am) && v.am >= 0 && typeof v.richtig === "boolean" && typeof v.kategorie === "string" && kategorien.includes(v.kategorie) &&
      (v.selbstBewertet === undefined || typeof v.selbstBewertet === "boolean") &&
      Array.isArray(v.hilfen) && v.hilfen.every(istText)) as LernSignal[];
    // Duplicate imported IDs must not manufacture additional evidence.
    return [...new Map(gueltig.map((s) => [s.id, s])).values()].sort((a, b) => a.am - b.am).slice(-240);
  } catch { return []; }
}
export function ladeLernsignale(): LernSignal[] { return leseLernsignale(appStorage.getItem(DIAGNOSE_KEY)); }
export function speichereLernsignal(signal: Omit<LernSignal, "id" | "am">, jetzt = Date.now()): void {
  const bisher = ladeLernsignale();
  let nummer = bisher.length;
  let id = `${signal.quelle}:${signal.aufgabeId}:${jetzt}:${nummer}`;
  while (bisher.some((s) => s.id === id)) id = `${signal.quelle}:${signal.aufgabeId}:${jetzt}:${++nummer}`;
  const neu = leseLernsignale(JSON.stringify([{ ...signal, id, am: jetzt }]));
  if (!neu.length) return;
  appStorage.setItem(DIAGNOSE_KEY, JSON.stringify([...bisher, neu[0]].slice(-240)));
}
export interface LernEmpfehlung { kategorie: LernKategorie; titel: string; grund: string; route: string; versuche: number; offen: number }
const TITEL: Record<LernKategorie, string> = {
  einheiten: "Einheiten sicher unterscheiden", formel: "Die passende Formel finden", rechenweg: "Den Rechenweg nachgehen",
  begriffe: "Fachbegriffe verständlich machen", leseverstehen: "Arbeitsaufträge genau lesen", englisch: "Baustellenenglisch üben", fachwissen: "Fachwissen gezielt wiederholen",
};
/** Recent answers and requests for help guide exercises, without permanent labels.
 * Two consecutive different, independently solved tasks on the same goal clear
 * its previous suggestions across categories (e.g. unit error → correct method).
 * Repeating the same answer, self-grading and retries after help cannot do this. */
export function lernEmpfehlungen(signale: LernSignal[], jetzt = Date.now()): LernEmpfehlung[] {
  const aktuell = leseLernsignale(JSON.stringify(signale)).filter((s) => jetzt - s.am <= 30 * 86400000 && s.am <= jetzt && !s.selbstBewertet).slice(-80);
  const ziele = new Map<string, LernSignal[]>();
  for (const s of aktuell) ziele.set(s.lernzielId, [...(ziele.get(s.lernzielId) ?? []), s]);
  const gruppen = new Map<string, LernSignal[]>();
  for (const ziel of ziele.values()) {
    const mitHilfeGesehen = new Set<string>();
    let vorherUnabhaengig: LernSignal | undefined;
    let erledigtBis = -1;
    ziel.forEach((s, index) => {
      if (s.hilfen.length) mitHilfeGesehen.add(s.aufgabeId);
      const unabhaengig = s.richtig && !s.hilfen.length && !mitHilfeGesehen.has(s.aufgabeId);
      if (unabhaengig && vorherUnabhaengig && vorherUnabhaengig.aufgabeId !== s.aufgabeId) erledigtBis = index;
      vorherUnabhaengig = unabhaengig ? s : undefined;
    });
    // New mistakes after a demonstrated success start a new suggestion; old
    // resolved mistakes are not revived by that later, unrelated observation.
    for (const s of ziel.slice(erledigtBis + 1)) {
      const key = `${s.kategorie}:${s.lernzielId}`;
      gruppen.set(key, [...(gruppen.get(key) ?? []), s]);
    }
  }
  return [...gruppen.values()].flatMap((gruppe) => {
    const offen = gruppe.filter((s) => !s.richtig).length;
    const hilfe = gruppe.filter((s) => s.hilfen.length).length;
    if (!offen && !hilfe) return [];
    const s = [...gruppe].reverse().find((s) => !s.richtig || s.hilfen.length)!;
    return [{ kategorie: s.kategorie, titel: TITEL[s.kategorie], route: s.route, versuche: gruppe.length, offen,
      grund: `${s.thema}: ${offen ? `${offen} von ${gruppe.length} zuletzt berücksichtigten Antworten waren noch nicht richtig.` : `Bei ${hilfe} der zuletzt berücksichtigten Antworten hast du eine Hilfe genutzt.`}` }];
  }).sort((a, b) => b.offen - a.offen || b.versuche - a.versuche).slice(0, 8);
}
