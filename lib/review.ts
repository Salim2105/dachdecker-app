import type { Bewertung } from "@/content/schema";
import { appStorage } from "@/lib/lernSpeicher";
import { progressStore } from "@/lib/progressStore";
import { ladeFortschritt } from "@/lib/progress";

export type ReviewQuelle = "fachwissen" | "mathe" | "sprache" | "projekt" | "bild";
export interface ReviewRef { quelle: ReviewQuelle; id: string; version: number; lernzielIds: string[] }
export interface ReviewResult {
  ref: ReviewRef; versuchId: string; bewertung: Bewertung; am: number; hilfen: string[];
  selbstBewertet?: boolean; nachErklaerung?: boolean;
}
export interface ReviewStand {
  ref: ReviewRef; letzterVersuch: number; faelligAm: number; intervallTage: number;
  verlauf: ReviewResult[]; verarbeiteteVersuche: string[];
}
export function createReviewResult(ref:ReviewRef,versuchId:string,bewertung:Bewertung,kontext:Pick<ReviewResult,"hilfen"|"selbstBewertet"|"nachErklaerung">,am=Date.now()):ReviewResult {
  return {ref,versuchId,bewertung,am,...kontext};
}
export const REVIEW_KEY = "wiederholungen-v1";
const TAG = 86400000;
const QUELLEN = ["fachwissen", "mathe", "sprache", "projekt", "bild"];
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && !!v.trim() && v.length <= 500;
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text);
const zeit = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 8640000000000000;
export const reviewKey = (ref: ReviewRef) => `${ref.quelle}:${ref.id}:v${ref.version}`;
export function validReviewRef(v: unknown): v is ReviewRef {
  return obj(v) && typeof v.quelle === "string" && QUELLEN.includes(v.quelle) && text(v.id) &&
    !["__proto__", "constructor", "prototype"].includes(v.id) && Number.isSafeInteger(v.version) && Number(v.version) > 0 && strings(v.lernzielIds);
}
export function validReviewResult(v: unknown): v is ReviewResult {
  return obj(v) && validReviewRef(v.ref) && text(v.versuchId) && typeof v.bewertung === "string" && ["richtig", "teilweise", "falsch"].includes(v.bewertung) && zeit(v.am) && strings(v.hilfen) &&
    (v.selbstBewertet === undefined || typeof v.selbstBewertet === "boolean") && (v.nachErklaerung === undefined || typeof v.nachErklaerung === "boolean");
}
export function parseReviewStore(raw: string | null): Record<string, ReviewStand> | null {
  if (raw === null) return {};
  try {
    const s: unknown = JSON.parse(raw);
    if (!obj(s) || s.version !== 1 || !obj(s.staende)) return null;
    for (const [key, v] of Object.entries(s.staende)) {
      if (!obj(v) || !validReviewRef(v.ref) || key !== reviewKey(v.ref) || !zeit(v.letzterVersuch) || !zeit(v.faelligAm) ||
        typeof v.intervallTage !== "number" || !Number.isFinite(v.intervallTage) || v.intervallTage < 0 || !Array.isArray(v.verlauf) ||
        !v.verlauf.every(r => validReviewResult(r) && reviewKey(r.ref) === key) || !strings(v.verarbeiteteVersuche) ||
        new Set(v.verarbeiteteVersuche).size !== v.verarbeiteteVersuche.length) return null;
    }
    return s.staende as unknown as Record<string, ReviewStand>;
  } catch { return null; }
}
export function loadReviewRecords(): Record<string, ReviewStand> { return parseReviewStore(appStorage.getItem(REVIEW_KEY)) ?? {}; }
export function reviewStorageError(): boolean { return parseReviewStore(appStorage.getItem(REVIEW_KEY)) === null; }
const listeners = new Set<() => void>();
export const subscribeReviews = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
export const reviewSnapshot = () => appStorage.getItem(REVIEW_KEY) ?? "";

/** One answer commits its history, deduplication IDs and schedule together. */
export function recordReviewResult(result: ReviewResult): boolean {
  if (!validReviewResult(result)) throw new Error("Die Lernrückmeldung ist unvollständig.");
  const all = parseReviewStore(appStorage.getItem(REVIEW_KEY));
  if (!all) throw new Error("Der Wiederholungsstand kann nicht gelesen werden. Bitte zuerst eine vollständige Sicherung erstellen.");
  const key = reviewKey(result.ref), old = all[key];
  if (old?.verarbeiteteVersuche.includes(result.versuchId)) return false;
  if (result.ref.quelle === "fachwissen") {
    progressStore.bewerte(result.ref.id, result.bewertung, { versuchId: result.versuchId, am: result.am,
      mitHilfe: result.hilfen.length > 0, selbstBewertet: result.selbstBewertet, nachErklaerung: result.nachErklaerung });
  }
  const sameDay = !!old && new Date(old.letzterVersuch).toDateString() === new Date(result.am).toDateString();
  const aided = result.hilfen.length > 0 || result.selbstBewertet || result.nachErklaerung;
  let intervallTage = result.bewertung === "falsch" ? 1 : result.bewertung === "teilweise" ? Math.max(2, Math.round((old?.intervallTage ?? 0) * 1.3)) : Math.max(2, (old?.intervallTage ?? 1) * 2);
  if (aided) intervallTage = result.bewertung === "teilweise" ? 2 : 1;
  intervallTage = Math.min(365, intervallTage);
  let faelligAm = Math.min(8640000000000000, result.am + intervallTage * TAG);
  if (old && result.bewertung === "richtig" && sameDay) { intervallTage = old.intervallTage; faelligAm = old.faelligAm; }
  if (old && result.am < old.letzterVersuch) { intervallTage = old.intervallTage; faelligAm = old.faelligAm; }
  all[key] = { ref: result.ref, letzterVersuch: Math.max(old?.letzterVersuch ?? 0, result.am), faelligAm, intervallTage,
    verlauf: [...(old?.verlauf ?? []), result].sort((a,b) => a.am-b.am).slice(-60),
    verarbeiteteVersuche: [...(old?.verarbeiteteVersuche ?? []), result.versuchId] };
  appStorage.setItem(REVIEW_KEY, JSON.stringify({version:1,staende:all}));
  listeners.forEach(f => f());
  return true;
}
export function reviewDue(ref: ReviewRef, records = loadReviewRecords()): number | null {
  if (ref.quelle === "fachwissen") return ladeFortschritt()[ref.id]?.faelligAm ?? null;
  return records[reviewKey(ref)]?.faelligAm ?? null;
}
export function reviewMastered(stand: ReviewStand): boolean {
  const tage = new Set<string>();
  for (const v of [...stand.verlauf].reverse()) {
    if(v.bewertung !== "richtig") break;
    if(!v.selbstBewertet && !v.nachErklaerung && !v.hilfen.length) tage.add(new Date(v.am).toDateString());
  }
  return tage.size >= 3;
}
