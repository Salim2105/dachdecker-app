import type { Bewertung } from "@/content/schema";
import type { LernEinheit } from "@/lib/curriculum";
import { istAktivitaetVollstaendig, starteAktivitaet, type AktivitaetAntwort } from "@/lib/aktivitaeten";
import { appStorage } from "@/lib/lernSpeicher";

export interface KursStand {
  version: number; phase: number; textIndex: number; notiz: string; verglichen: boolean;
  selbstbewertung?: Bewertung; kontrolleIndex: number; ergebnisse: { id: string; bewertung: Bewertung }[];
  aktivitaet: AktivitaetAntwort; aktivitaetGeprueft: boolean; abgeschlossen: boolean; hilfen: string[];
  /** Only a previous note is carried over; the revised tasks start ungraded. */
  uebernommenAusVersion?: number;
}
export interface KursArchivEintrag {
  key: string; einheitId: string; version: number; notiz: string; abgeschlossen: boolean;
  ergebnisse: { id: string; bewertung: Bewertung }[]; selbstbewertung?: Bewertung;
}
const istObjekt = (s: unknown): s is Record<string, unknown> => !!s && typeof s === "object" && !Array.isArray(s);
const istBewertung = (b: unknown): b is Bewertung => b === "richtig" || b === "teilweise" || b === "falsch";
const istTextliste = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === "string");
function sindErgebnisse(v: unknown): v is KursStand["ergebnisse"] {
  return Array.isArray(v) && v.every((r) => istObjekt(r) && typeof r.id === "string" && istBewertung(r.bewertung)) && new Set(v.map((r) => r.id)).size === v.length;
}
export const kursStandKey = (e: Pick<LernEinheit, "id" | "version">) => `lernwerkstatt-einheit-${e.id}-v${e.version}`;
export function neuerKursStand(e: LernEinheit): KursStand {
  return { version: e.version, phase: 0, textIndex: 0, notiz: "", verglichen: false, kontrolleIndex: 0,
    ergebnisse: [], aktivitaet: e.aktivitaet ? starteAktivitaet(e.aktivitaet) : { zuordnung: {}, reihenfolge: [], auswahl: [] },
    aktivitaetGeprueft: false, abgeschlossen: false, hilfen: [] };
}
function leseArchivStand(text: string | null, key: string, einheitId: string, version: number): KursArchivEintrag | null {
  try {
    const s: unknown = JSON.parse(text || "null");
    if (!istObjekt(s) || s.version !== version || typeof s.notiz !== "string" || typeof s.abgeschlossen !== "boolean" || !sindErgebnisse(s.ergebnisse) ||
      (s.selbstbewertung !== undefined && !istBewertung(s.selbstbewertung))) return null;
    return { key, einheitId, version, notiz: s.notiz, abgeschlossen: s.abgeschlossen, ergebnisse: s.ergebnisse,
      ...(s.selbstbewertung !== undefined ? { selbstbewertung: s.selbstbewertung } : {}) };
  } catch { return null; }
}
/** Read-only history, including old automatic text chunks no longer in the course.
 * Keys are retained so full backups can still restore every previous record. */
export function ladeKursArchiv(lfId: string, aktuelleEinheiten: Pick<LernEinheit, "id" | "version">[]): KursArchivEintrag[] {
  const aktuell = new Set(aktuelleEinheiten.map(kursStandKey));
  const archiv: KursArchivEintrag[] = [];
  for (let index = 0; index < appStorage.length; index++) {
    const key = appStorage.key(index);
    if (!key || aktuell.has(key)) continue;
    const teile = /^lernwerkstatt-einheit-(.+)-v([1-9]\d*)$/.exec(key);
    if (!teile || !teile[1].startsWith(`${lfId}-`)) continue;
    const version = Number(teile[2]);
    if (!Number.isSafeInteger(version)) continue;
    const stand = leseArchivStand(appStorage.getItem(key), key, teile[1], version);
    if (stand && (stand.notiz.trim() || stand.ergebnisse.length || stand.selbstbewertung || stand.abgeschlossen)) archiv.push(stand);
  }
  return archiv.sort((a, b) => a.einheitId.localeCompare(b.einheitId, "de") || b.version - a.version);
}
function migriereVorherigeNotiz(e: LernEinheit): KursStand {
  const leer = neuerKursStand(e);
  // A revised unit never inherits completion, grading or an old exercise draft.
  // Do not write while reading: the UI persists the new stand with its next edit.
  for (let version = e.version - 1; version >= 1; version--) {
    const key = kursStandKey({ id: e.id, version });
    const vorher = leseArchivStand(appStorage.getItem(key), key, e.id, version);
    if (vorher) return { ...leer, notiz: vorher.notiz, uebernommenAusVersion: version };
  }
  return leer;
}
export function ladeKursStand(e: LernEinheit): KursStand {
  try {
    const text = appStorage.getItem(kursStandKey(e));
    if (text === null) return migriereVorherigeNotiz(e);
    const s: unknown = JSON.parse(text);
    if (!istObjekt(s) || s.version !== e.version || !Number.isInteger(s.phase) || Number(s.phase) < 0 || Number(s.phase) > 4 ||
      !Number.isInteger(s.textIndex) || Number(s.textIndex) < 0 || Number(s.textIndex) >= e.textschritte.length ||
      typeof s.notiz !== "string" || typeof s.verglichen !== "boolean" || typeof s.abgeschlossen !== "boolean" ||
      !Number.isInteger(s.kontrolleIndex) || Number(s.kontrolleIndex) < 0 || Number(s.kontrolleIndex) >= Math.max(1, e.aufgabenIds.length) ||
      !sindErgebnisse(s.ergebnisse) || !s.ergebnisse.every((r) => e.aufgabenIds.includes(r.id)) ||
      (s.selbstbewertung !== undefined && !istBewertung(s.selbstbewertung)) ||
      (s.uebernommenAusVersion !== undefined && (!Number.isInteger(s.uebernommenAusVersion) || Number(s.uebernommenAusVersion) < 1 || Number(s.uebernommenAusVersion) >= e.version)) ||
      typeof s.aktivitaetGeprueft !== "boolean" || !istObjekt(s.aktivitaet) || !istObjekt(s.aktivitaet.zuordnung) ||
      !Object.values(s.aktivitaet.zuordnung).every((v) => typeof v === "string") ||
      !istTextliste(s.aktivitaet.reihenfolge) || !istTextliste(s.aktivitaet.auswahl) || !istTextliste(s.hilfen)) return neuerKursStand(e);
    const a = s.aktivitaet as unknown as AktivitaetAntwort;
    if (e.aktivitaet?.typ === "reihenfolge" && (a.reihenfolge.length !== e.aktivitaet.schritte.length || new Set(a.reihenfolge).size !== e.aktivitaet.schritte.length || !e.aktivitaet.schritte.every((p) => a.reihenfolge.includes(p.id)))) return neuerKursStand(e);
    if (e.aktivitaet?.typ === "zuordnen" && Object.entries(a.zuordnung).some(([links, rechts]) => !e.aktivitaet || e.aktivitaet.typ !== "zuordnen" || !e.aktivitaet.paare.some((p) => p.id === links) || (rechts !== "" && !e.aktivitaet.paare.some((p) => p.id === rechts)))) return neuerKursStand(e);
    if ((e.aktivitaet?.typ === "baustellenfall" || e.aktivitaet?.typ === "skizzenfehler") && (new Set(a.auswahl).size !== a.auswahl.length || !a.auswahl.every((id) => e.aktivitaet && (e.aktivitaet.typ === "baustellenfall" || e.aktivitaet.typ === "skizzenfehler") && e.aktivitaet.optionen.some((o) => o.id === id)))) return neuerKursStand(e);
    if (s.aktivitaetGeprueft && e.aktivitaet && !istAktivitaetVollstaendig(e.aktivitaet, a)) return neuerKursStand(e);
    if ((Number(s.phase) >= 2 || s.abgeschlossen) && (!s.verglichen || !s.selbstbewertung)) return neuerKursStand(e);
    if ((Number(s.phase) >= 3 || s.abgeschlossen) && s.ergebnisse.length !== e.aufgabenIds.length) return neuerKursStand(e);
    if ((s.phase === 4 || s.abgeschlossen) && e.aktivitaet && !s.aktivitaetGeprueft) return neuerKursStand(e);
    return s as unknown as KursStand;
  } catch { return neuerKursStand(e); }
}
