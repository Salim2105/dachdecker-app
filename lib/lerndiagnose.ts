import { appStorage } from "@/lib/lernSpeicher";
import { loadReviewRecords, reviewKey } from "@/lib/review";
import { istLernRoute, LERN_KATEGORIEN, type LernKategorie, type LernHinweis } from "@/lib/lernHinweise";
export type {LernKategorie} from "@/lib/lernHinweise";

export interface LernSignal {
  id: string; am: number; quelle: "mathe" | "deutsch" | "englisch" | "fachwissen" | "einstieg" | "projekt" | "bild";
  aufgabeId: string; lernzielId: string; richtig: boolean; selbstBewertet?: boolean;
  kategorie: LernKategorie; hilfen: string[]; route: string; thema: string; hinweis?:string;
}
export const DIAGNOSE_KEY = "lernhinweise-v1";
const kategorien:readonly string[]=LERN_KATEGORIEN;
const istObjekt = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const istText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
/** Only known local learning destinations can be restored from an imported file. */
export function leseLernsignale(text: string | null): LernSignal[] {
  try {
    const values: unknown = JSON.parse(text ?? "[]");
    if (!Array.isArray(values)) return [];
    const gueltig = values.filter((v) => istObjekt(v) &&
      ["id", "aufgabeId", "lernzielId", "thema"].every((k) => istText(v[k])) && istLernRoute(v.route) &&
      typeof v.quelle === "string" && ["mathe", "deutsch", "englisch", "fachwissen", "einstieg", "projekt", "bild"].includes(v.quelle) &&
      typeof v.am === "number" && Number.isFinite(v.am) && v.am >= 0 && typeof v.richtig === "boolean" && typeof v.kategorie === "string" && kategorien.includes(v.kategorie) &&
      (v.selbstBewertet === undefined || typeof v.selbstBewertet === "boolean") && (v.hinweis===undefined||typeof v.hinweis==="string"&&v.hinweis.length<=1200) &&
      Array.isArray(v.hilfen) && v.hilfen.every(istText)) as LernSignal[];
    // Duplicate imported IDs must not manufacture additional evidence.
    return [...new Map(gueltig.map((s) => [s.id, s])).values()].sort((a, b) => a.am - b.am).slice(-240);
  } catch { return []; }
}
export function ladeLernsignale(): LernSignal[] {
  const neu:LernSignal[]=[];
  for(const s of Object.values(loadReviewRecords()))for(const r of s.verlauf)for(const [i,h]of(r.hinweise??[]).entries()){
    const quelle=r.ref.quelle==="sprache"?"fachwissen":r.ref.quelle;
    neu.push({...h,id:`review:${reviewKey(r.ref)}:${r.versuchId}:${i}`,am:r.am,quelle,aufgabeId:r.ref.id,selbstBewertet:r.selbstBewertet,hilfen:[...r.hilfen,...(r.nachErklaerung?["direkt-nach-erklaerung"]:[])]});
  }
  return leseLernsignale(JSON.stringify([...leseLernsignale(appStorage.getItem(DIAGNOSE_KEY)),...neu]));
}
/** A persisted project event can be replayed after interruption without new IDs. */
export function speichereLernsignaleEinmal(signale:LernSignal[]):void {
  const bisher=leseLernsignale(appStorage.getItem(DIAGNOSE_KEY)),ids=new Set(bisher.map(s=>s.id));
  const neu=leseLernsignale(JSON.stringify(signale)).filter(s=>!ids.has(s.id));
  if(neu.length)appStorage.setItem(DIAGNOSE_KEY,JSON.stringify(leseLernsignale(JSON.stringify([...bisher,...neu]))));
}
export function neueProjektSignale(versuchId:string,aufgabeId:string,hinweise:LernHinweis[],hilfen:string[],nummer:number,am=Date.now()):LernSignal[]{const id=globalThis.crypto.randomUUID();return hinweise.map((h,i)=>({...h,id:`${versuchId}:${aufgabeId}:${nummer}:${id}:${i}`,am,quelle:"projekt",aufgabeId,hilfen:[...hilfen]}));}
export function speichereLernsignal(signal: Omit<LernSignal, "id" | "am">, jetzt = Date.now()): void {
  const bisher = leseLernsignale(appStorage.getItem(DIAGNOSE_KEY));
  let nummer = bisher.length;
  let id = `${signal.quelle}:${signal.aufgabeId}:${jetzt}:${nummer}`;
  while (bisher.some((s) => s.id === id)) id = `${signal.quelle}:${signal.aufgabeId}:${jetzt}:${++nummer}`;
  const neu = leseLernsignale(JSON.stringify([{ ...signal, id, am: jetzt }]));
  if (!neu.length) return;
  appStorage.setItem(DIAGNOSE_KEY, JSON.stringify([...bisher, neu[0]].slice(-240)));
}
export interface LernEmpfehlung { kategorie: LernKategorie; titel: string; grund: string; route: string; versuche: number; offen: number; lernzielId:string; hinweis?:string }
const TITEL: Record<LernKategorie, string> = {
  einheiten: "Einheiten sicher unterscheiden", formel: "Die passende Formel finden", rechenweg: "Den Rechenweg nachgehen",
  begriffe: "Fachbegriffe verständlich machen", leseverstehen: "Arbeitsaufträge genau lesen", englisch: "Baustellenenglisch üben", fachwissen: "Fachwissen gezielt wiederholen",
  ablauf:"Arbeitsschritte sicher ordnen",schichten:"Schichten und ihre Aufgaben unterscheiden",wasserweg:"Den Wasserweg nachverfolgen",befund:"Befund und Ursache auseinanderhalten",
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
    return [{ kategorie: s.kategorie, titel: TITEL[s.kategorie], route: s.route, versuche: gruppe.length, offen,lernzielId:s.lernzielId,hinweis:s.hinweis,
      grund: `${s.thema}: ${offen ? `${offen} von ${gruppe.length} zuletzt berücksichtigten Antworten waren noch nicht richtig.` : `Bei ${hilfe} der zuletzt berücksichtigten Antworten hast du eine Hilfe genutzt.`}` }];
  }).sort((a, b) => b.offen - a.offen || b.versuche - a.versuche).slice(0, 8);
}
