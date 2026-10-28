import { AUFBAU_EINHEITEN, erzeugeAufbauAufgabe, type AufbauAufgabe, type AufbauAntwort } from "@/lib/matheAufbau";
import { appStorage } from "@/lib/lernSpeicher";
import { leseDezimalzahl } from "@/lib/zahlen";
import { erzeugePruefungsFall, FALL_THEMEN } from "@/lib/pruefungsFaelle";

export const PRUEFUNGS_MATHE_KEY = "pruefungsmathe-v1";
export const PRUEFUNGS_MATHE_AUFGABEN = AUFBAU_EINHEITEN.flatMap(e => e.aufgabenIds.map((id, index) => ({ id, titel: `${e.titel} · Aufgabe ${index + 1}`, familie: e.id })));
export type PruefungsMatheAufgabe = { typ: "aufbau"; aufgabe: AufbauAufgabe } | { typ: "transfer"; fallId: string; variante: number; frage: string; wert: number; einheit: string; toleranz: number; erklaerung: string; titel: string };
export interface PruefungsMatheErgebnis { erreicht: number; moeglich: number; richtig: boolean; schritte: Record<string, { wertRichtig: boolean; einheitRichtig: boolean }> }
export interface PruefungsMatheVersuch {
 version: 1; id: string; aufgabenId: string; familie: string; gestartetAm: number; abgegebenAm: number | null;
 aufgabe: PruefungsMatheAufgabe; antworten: Record<string, AufbauAntwort>; formel: string; erstFormel?: string;
 hilfen: string[]; werkzeuge: string[]; nachErklaerung: boolean; selbstVerglichen: boolean; ergebnis?: PruefungsMatheErgebnis;
}
export interface PruefungsMatheStand { version: 1; aktiv: string | null; versuche: PruefungsMatheVersuch[] }
export const neuerPruefungsMatheStand = (): PruefungsMatheStand => ({ version: 1, aktiv: null, versuche: [] });
const kopie = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
export function neuePruefungsMatheAufgabe(aufgabenId: string, variante = 0): PruefungsMatheAufgabe {
 if (!Number.isSafeInteger(variante) || variante < 0) throw new Error("Die Aufgabenvariante ist ungültig.");
 if (aufgabenId.startsWith("transfer:")) {
  const fallId = aufgabenId.slice(9), fall = erzeugePruefungsFall(fallId, variante % 3);
  return { typ: "transfer", fallId, variante: fall.variante, titel: `${fall.titel}: neuer Zusammenhang`, ...kopie(fall.transfer) };
 }
 if (!PRUEFUNGS_MATHE_AUFGABEN.some(a => a.id === aufgabenId)) throw new Error("Diese Prüfungsaufgabe ist nicht vorhanden.");
 return { typ: "aufbau", aufgabe: erzeugeAufbauAufgabe(aufgabenId, variante % 5) };
}
export function neuerPruefungsMatheVersuch(aufgabenId: string, variante = 0, jetzt = Date.now(), nachErklaerung = false): PruefungsMatheVersuch {
 const aufgabe = neuePruefungsMatheAufgabe(aufgabenId, variante);
 return { version: 1, id: `matheprobe:${globalThis.crypto.randomUUID()}`, aufgabenId, familie: aufgabe.typ === "aufbau" ? aufgabe.aufgabe.einheitId : aufgabe.fallId,
  gestartetAm: jetzt, abgegebenAm: null, aufgabe, antworten: {}, formel: "", hilfen: [], werkzeuge: [], nachErklaerung, selbstVerglichen: false };
}
export function pruefungsMatheSchritte(v: PruefungsMatheVersuch) {
 return v.aufgabe.typ === "aufbau" ? v.aufgabe.aufgabe.schritte : [{ id: "transfer", label: "Ergebnis des veränderten Auftrags", wert: v.aufgabe.wert, einheit: v.aufgabe.einheit, einheiten: [...new Set([v.aufgabe.einheit,"m","m²","kg","Stück","%"])], stellen: ["Stück","Bahnen"].includes(v.aufgabe.einheit)?0:2, toleranz: v.aufgabe.toleranz, ganzzahl: ["Stück","Bahnen"].includes(v.aufgabe.einheit), formel: "", einsetzen: "" }];
}
/** One point for the value and one for its required unit; formula notes are self-compared. */
export function pruefePruefungsMathe(v: PruefungsMatheVersuch): PruefungsMatheErgebnis | null {
 const schritte: PruefungsMatheErgebnis["schritte"] = {};
 if (!pruefungsMatheSchritte(v).length) return null;
 for (const s of pruefungsMatheSchritte(v)) {
  const antwort = v.antworten[s.id], zahl = antwort && leseDezimalzahl(antwort.wert);
  if (!antwort || zahl === null || zahl === undefined || /[.,]$/.test(antwort.wert.trim()) || !s.einheiten.includes(antwort.einheit)) return null;
  const epsilon = Math.max(1, Math.abs(s.wert)) * Number.EPSILON * 8;
  schritte[s.id] = { wertRichtig: (!s.ganzzahl || Number.isInteger(zahl)) && Math.abs(zahl - s.wert) <= s.toleranz + epsilon, einheitRichtig: antwort.einheit === s.einheit };
 }
 const erreicht = Object.values(schritte).reduce((sum, s) => sum + Number(s.wertRichtig) + Number(s.einheitRichtig), 0), moeglich = Object.keys(schritte).length * 2;
 return { erreicht, moeglich, richtig: erreicht === moeglich, schritte };
}
export function abgegebenerPruefungsMatheVersuch(v: PruefungsMatheVersuch, jetzt = Date.now()): PruefungsMatheVersuch {
 if (v.abgegebenAm !== null) return v;
 const ergebnis = pruefePruefungsMathe(v);
 if (!ergebnis) throw new Error("Trage für jeden Schritt eine vollständige Zahl ein und wähle die Einheit.");
 return { ...kopie(v), abgegebenAm: Math.max(jetzt, v.gestartetAm), erstFormel: v.formel, ergebnis };
}
const objekt = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.length <= 20000;
const endlich = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const sichererId = (v: unknown): v is string => text(v) && /^[a-zA-Z0-9_-]+$/.test(v) && !["__proto__","constructor","prototype"].includes(v);
function istAufgabe(v: unknown, id: string): v is PruefungsMatheAufgabe {
 if (!objekt(v)) return false;
 if (v.typ === "transfer") return typeof v.fallId === "string" && FALL_THEMEN.some(f => f.id === v.fallId) && id === `transfer:${v.fallId}` && Number.isSafeInteger(v.variante) && Number(v.variante) >= 0 && text(v.frage) && text(v.titel) && text(v.einheit) && text(v.erklaerung) && endlich(v.wert) && endlich(v.toleranz) && v.toleranz >= 0;
 const a = v.aufgabe;
 if (v.typ !== "aufbau" || !objekt(a) || a.id !== id || !PRUEFUNGS_MATHE_AUFGABEN.some(t => t.id === id && t.familie === a.einheitId) || a.version !== 1 || !Number.isSafeInteger(a.variante) || Number(a.variante) < 0 || !text(a.frage) || !text(a.titel) || !text(a.erklaerung) || !Array.isArray(a.gegeben) || !a.gegeben.every(text) || !Array.isArray(a.schritte) || !a.schritte.length || a.schritte.length > 20) return false;
 return new Set(a.schritte.map(s => objekt(s) ? s.id : null)).size === a.schritte.length && a.schritte.every(s => objekt(s) && sichererId(s.id) && ["label","formel","einsetzen","einheit"].every(k => text(s[k])) && endlich(s.wert) && endlich(s.toleranz) && s.toleranz >= 0 && Number.isSafeInteger(s.stellen) && Number(s.stellen) >= 0 && Number(s.stellen) <= 8 && typeof s.ganzzahl === "boolean" && Array.isArray(s.einheiten) && s.einheiten.every(text) && s.einheiten.includes(String(s.einheit)));
}
export function parsePruefungsMatheStand(raw: string | null): PruefungsMatheStand | null {
 if (raw === null) return neuerPruefungsMatheStand();
 try {
  const s: unknown = JSON.parse(raw);
  if (!objekt(s) || s.version !== 1 || (s.aktiv !== null && !text(s.aktiv)) || !Array.isArray(s.versuche) || s.versuche.length > 10000) return null;
  const ids = new Set<string>();
  for (const item of s.versuche) {
   if (!objekt(item) || item.version !== 1 || !text(item.id) || !item.id || ids.has(item.id) || !text(item.aufgabenId) || !text(item.familie) || !endlich(item.gestartetAm) || item.gestartetAm < 0 || item.gestartetAm > 8640000000000000 || (item.abgegebenAm !== null && (!endlich(item.abgegebenAm) || item.abgegebenAm < item.gestartetAm || item.abgegebenAm > 8640000000000000)) || !istAufgabe(item.aufgabe,item.aufgabenId) || !objekt(item.antworten) || !text(item.formel) || (item.erstFormel !== undefined && !text(item.erstFormel)) || !Array.isArray(item.hilfen) || !item.hilfen.every(text) || !Array.isArray(item.werkzeuge) || !item.werkzeuge.every(text) || typeof item.nachErklaerung !== "boolean" || typeof item.selbstVerglichen !== "boolean") return null;
   const v = item as unknown as PruefungsMatheVersuch, schritte = pruefungsMatheSchritte(v);
   if (v.familie !== (v.aufgabe.typ === "aufbau" ? v.aufgabe.aufgabe.einheitId : v.aufgabe.fallId)) return null;
   for (const [key,antwort] of Object.entries(item.antworten)) if (!schritte.some(s => s.id === key) || !objekt(antwort) || !text(antwort.wert) || !text(antwort.einheit)) return null;
   if (item.abgegebenAm !== null) {const r=pruefePruefungsMathe(v);if(!r||item.erstFormel===undefined)return null;v.ergebnis=r;}
   else if (item.ergebnis !== undefined || item.erstFormel !== undefined) return null;
   ids.add(item.id);
  }
  if (s.aktiv !== null && !ids.has(String(s.aktiv))) return null;
  return s as unknown as PruefungsMatheStand;
 } catch { return null; }
}
export const ladePruefungsMatheStand = () => parsePruefungsMatheStand(appStorage.getItem(PRUEFUNGS_MATHE_KEY));
export function speicherePruefungsMatheStand(s: PruefungsMatheStand) {
 const raw=JSON.stringify(s);
 if(!parsePruefungsMatheStand(raw))throw new Error("Der Mathe-Prüfungsstand ist unvollständig.");
 appStorage.setItem(PRUEFUNGS_MATHE_KEY,raw);
}
