import { appStorage } from "@/lib/lernSpeicher";
import { DACH_DETAILS, getDachDetail } from "@/lib/dach3dInhalte";
import { DACH_FORMEN, DACH_SCHICHTEN, dachDeckung, istDachMedienRef } from "@/lib/dach3dMedien";
import type { Bewertung } from "@/content/schema";
import type { DachAntwort, DachAufgabe, DachErkundungStand, DachForm, DachPosition } from "@/lib/dach3dTypen";
import { parseReviewStore, REVIEW_KEY } from "@/lib/review";

export const dachStandKey = "dach3d-erkundung-v1";
export const DACH_STAND_KEY = dachStandKey;
export const DACH_NACHARBEIT_MS = 30 * 60 * 1000;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 12000): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const str = (v: unknown, max = 12000): v is string => typeof v === "string" && v.length <= max;
const key = (v: unknown): v is string => text(v, 200) && /^[a-zA-Z0-9_-]+$/.test(v) && !["__proto__", "prototype", "constructor"].includes(v);
const zeit = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 8640000000000000;
const int = (v: unknown, max: number): v is number => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;
const unique = (v: readonly unknown[]) => new Set(v).size === v.length;
const texte = (v: unknown, max = 100): v is string[] => Array.isArray(v) && v.length <= max && v.every(x => text(x, 1000));
const ids = (v: unknown, max = 100): v is string[] => Array.isArray(v) && v.length <= max && v.every(key) && unique(v);
const gleich = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const phasen = ["erkennen", "aufbau", "montage", "kontrolle", "aufgaben"];
const ansichten = ["nah", "schnitt", "aufbau"];
const modi = ["begleitet", "probelauf"];

export function validDachAufgabe(v: unknown): v is DachAufgabe {
  if (!obj(v) || !key(v.id) || !int(v.version, 10000) || v.version < 1 || !text(v.detailId, 20) || ![v.titel, v.frage, v.erklaerung].every(x => text(x)) || !ids(v.lernzielIds) || !v.lernzielIds.length || !ansichten.includes(String(v.ansicht))) return false;
  const d = getDachDetail(v.detailId);
  if (!d || !d.aufgaben.some(a => a.id === v.id) || !Array.isArray(v.optionen) || v.optionen.length < 2 || v.optionen.length > 12 || !v.optionen.every(o => obj(o) && key(o.id) && text(o.text) && typeof o.korrekt === "boolean") || !unique(v.optionen.map(o => o.id))) return false;
  const richtige = v.optionen.filter(o => o.korrekt).length;
  return richtige > 0 && richtige < v.optionen.length;
}
export function bewerteDachAntwort(a: DachAufgabe, auswahl: string[]): Bewertung | null {
  if (!validDachAufgabe(a) || !ids(auswahl, 12) || !auswahl.length || auswahl.some(id => !a.optionen.some(o => o.id === id))) return null;
  const richtige = a.optionen.filter(o => o.korrekt).map(o => o.id);
  const treffer = auswahl.filter(id => richtige.includes(id)).length;
  const falsch = auswahl.length - treffer;
  return falsch === 0 && treffer === richtige.length ? "richtig" : Math.max(0, treffer - falsch) > 0 ? "teilweise" : "falsch";
}
function position(form: DachForm): DachPosition {
  return { deckung: dachDeckung(form), detailId: null, phase: "erkennen", schritt: 0,
    ansicht: "nah", schichten: [...DACH_SCHICHTEN], kamera: "gesamt", modus: "begleitet", wasser: 0 };
}
export function neuerDachStand(now = Date.now()): DachErkundungStand {
  if (!zeit(now)) throw new Error("Der Zeitpunkt des Dachlernstands ist ungültig.");
  return { version: 1, id: `dach3d-${globalThis.crypto.randomUUID()}`, revision: 0, erstelltAm: now, aktualisiertAm: now,
    form: "steildach", jeDach: { steildach: position("steildach"), walmdach: position("walmdach"), flachdach: position("flachdach") },
    antworten: {}, notizen: {}, hilfeEreignisse: [] };
}
function gueltigePosition(v: unknown, form: DachForm): v is DachPosition {
  if (!obj(v) || dachDeckung(form, v.deckung as DachPosition["deckung"]) !== v.deckung || !phasen.includes(String(v.phase)) || !ansichten.includes(String(v.ansicht)) || !["gesamt", "nah", "seite", "oben"].includes(String(v.kamera)) || !modi.includes(String(v.modus)) || !int(v.wasser, 4) || !ids(v.schichten, DACH_SCHICHTEN.length) || !v.schichten.every(x => (DACH_SCHICHTEN as readonly string[]).includes(x))) return false;
  const vector = (x: unknown) => Array.isArray(x) && x.length === 3 && x.every(n => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 1000);
  if (v.orbit !== undefined && (!obj(v.orbit) || !vector(v.orbit.position) || !vector(v.orbit.target))) return false;
  if (v.detailId === null) return int(v.schritt, 0);
  if (typeof v.detailId !== "string") return false;
  const detail = getDachDetail(v.detailId);
  return !!detail && detail.formen.includes(form) && int(v.schritt, v.phase === "aufgaben" ? 1 : detail.schritte.length - 1);
}
function gueltigeAntwort(v: unknown, id: string, s: DachErkundungStand): v is DachAntwort {
  if (!obj(v) || !text(v.versuchId, 500) || !validDachAufgabe(v.aufgabe) || v.aufgabe.id !== id || v.versuchId !== `${s.id}:${id}` || !ids(v.auswahl, 12) || v.auswahl.some(id => !(v.aufgabe as DachAufgabe).optionen.some(o => o.id === id)) || typeof v.geprueft !== "boolean" || !texte(v.hilfen, 1000) || !unique(v.hilfen) || typeof v.nachErklaerung !== "boolean") return false;
  if (!istDachMedienRef(v.medienRef) || v.medienRef.detailId !== v.aufgabe.detailId) return false;
  if (v.geprueft) return ids(v.ersteAuswahl, 12) && gleich(v.ersteAuswahl, v.auswahl) && zeit(v.abgegebenAm) && v.abgegebenAm >= s.erstelltAm && v.abgegebenAm <= s.aktualisiertAm && v.bewertung === bewerteDachAntwort(v.aufgabe, v.auswahl) && v.bewertung !== null;
  return v.ersteAuswahl === undefined && v.abgegebenAm === undefined && v.bewertung === undefined;
}
export function parseDachStand(raw: string | null): DachErkundungStand | null {
  if (raw === null || raw.length > 5_000_000) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!obj(v) || v.version !== 1 || !key(v.id) || !int(v.revision, Number.MAX_SAFE_INTEGER) || !zeit(v.erstelltAm) || !zeit(v.aktualisiertAm) || v.aktualisiertAm < v.erstelltAm || !DACH_FORMEN.includes(v.form as DachForm) || !obj(v.jeDach) || Object.keys(v.jeDach).length !== 3 || !DACH_FORMEN.every(f => gueltigePosition((v.jeDach as Record<string, unknown>)[f], f)) || !obj(v.antworten) || Object.keys(v.antworten).length > 68 || !obj(v.notizen) || Object.keys(v.notizen).length > 37 || !Array.isArray(v.hilfeEreignisse) || v.hilfeEreignisse.length > 10000) return null;
    const s = v as unknown as DachErkundungStand;
    if (!Object.entries(s.antworten).every(([id, a]) => key(id) && gueltigeAntwort(a, id, s)) || !Object.entries(s.notizen).every(([id, notiz]) => (!!getDachDetail(id) || DACH_FORMEN.includes(id as DachForm)) && str(notiz))) return null;
    if (!s.hilfeEreignisse.every((e, i) => obj(e) && typeof e.detailId === "string" && !!getDachDetail(e.detailId) && text(e.art, 500) && zeit(e.am) && e.am >= s.erstelltAm && e.am <= s.aktualisiertAm && (i === 0 || e.am >= s.hilfeEreignisse[i - 1].am))) return null;
    return s;
  } catch { return null; }
}
export function ladeDachStand(): DachErkundungStand | null {
  const raw = appStorage.getItem(dachStandKey);
  if (raw === null) return null;
  const s = parseDachStand(raw);
  if (!s) throw new Error("Dein vorhandener Dachlernstand ist nicht lesbar und bleibt erhalten. Bitte zuerst eine vollständige Sicherung erstellen.");
  return s;
}
export function speichereDachStand(s: DachErkundungStand): void {
  const raw = appStorage.getItem(dachStandKey), alt = raw === null ? null : parseDachStand(raw);
  if (raw !== null && !alt) throw new Error("Der vorhandene Dachlernstand ist beschädigt und wird nicht überschrieben. Bitte zuerst sichern.");
  if (!parseDachStand(JSON.stringify(s))) throw new Error("Der Dachlernstand ist unvollständig und wurde nicht gespeichert.");
  if (alt && !gleich(alt, s)) {
    if (alt.id !== s.id || alt.erstelltAm !== s.erstelltAm) throw new Error("Der vorhandene Dachlernstand bleibt erhalten.");
    if (s.revision <= alt.revision || s.aktualisiertAm < alt.aktualisiertAm) throw new Error("Ein neuerer Dachlernstand ist gespeichert. Bitte den Bereich neu öffnen.");
    if (!gleich(alt.hilfeEreignisse, s.hilfeEreignisse.slice(0, alt.hilfeEreignisse.length))) throw new Error("Bereits geöffnete Erklärungen bleiben dokumentiert.");
    for (const [id, vorher] of Object.entries(alt.antworten)) {
      const nachher = s.antworten[id];
      if (!nachher || !gleich(vorher.aufgabe, nachher.aufgabe) || !gleich(vorher.medienRef, nachher.medienRef) || vorher.versuchId !== nachher.versuchId || vorher.hilfen.some(h => !nachher.hilfen.includes(h)) || vorher.nachErklaerung && !nachher.nachErklaerung || vorher.geprueft && !gleich(vorher, nachher)) throw new Error("Deine ersten Antworten, Übungsangaben und benutzten Hilfen bleiben unverändert erhalten.");
    }
  }
  appStorage.setItem(dachStandKey, JSON.stringify(s));
}
function bearbeiten(s: DachErkundungStand, now = Date.now()): DachErkundungStand {
  if (!zeit(now)) throw new Error("Ungültiger Speicherzeitpunkt.");
  const neu = clone(s); neu.revision++; neu.aktualisiertAm = Math.max(now, s.aktualisiertAm); return neu;
}
function zeitnaheTagesAntworten(detailId: string, am: number, versuchId?: string): string[] {
  const historie = parseReviewStore(appStorage.getItem(REVIEW_KEY));
  if (!historie) throw new Error("Der Wiederholungsstand ist nicht lesbar. Bitte zuerst eine vollständige Sicherung erstellen.");
  const aufgaben = getDachDetail(detailId)?.aufgaben.map(a => a.id) ?? [];
  return Object.values(historie).some(stand => stand.ref.quelle === "bild" && aufgaben.includes(stand.ref.id) && stand.verlauf.some(r =>
    r.versuchId !== versuchId && r.am <= am && am - r.am <= DACH_NACHARBEIT_MS
  )) ? ["vergleich-der-tagesantwort"] : [];
}
function zeitnaheHilfen(s: DachErkundungStand, detailId: string, am: number, versuchId?: string): string[] {
  return [...new Set([
    ...s.hilfeEreignisse.filter(h => h.detailId === detailId && h.am <= am && am - h.am <= DACH_NACHARBEIT_MS).map(h => h.art),
    ...Object.values(s.antworten).filter(a => a.aufgabe.detailId === detailId && a.geprueft && a.abgegebenAm! <= am && am - a.abgegebenAm! <= DACH_NACHARBEIT_MS).map(() => "vergleich-der-vorigen-antwort"),
    ...zeitnaheTagesAntworten(detailId, am, versuchId),
  ])];
}
/** Pure, stable getter: freeze this value in antworten before editing it. */
export function dachAntwort(s: DachErkundungStand, aufgabe: DachAufgabe, now = Date.now()): DachAntwort {
  if (s.antworten[aufgabe.id]) return clone(s.antworten[aufgabe.id]);
  if (!validDachAufgabe(aufgabe)) throw new Error("Diese Dachaufgabe ist unvollständig.");
  const detail = getDachDetail(aufgabe.detailId)!;
  const form = detail.formen.includes(s.form) ? s.form : detail.formen[0];
  const hilfen = zeitnaheHilfen(s, detail.id, Math.max(now, s.aktualisiertAm));
  return { versuchId: `${s.id}:${aufgabe.id}`, aufgabe: clone(aufgabe), auswahl: [], geprueft: false, hilfen,
    nachErklaerung: hilfen.length > 0, medienRef: { form, deckung: s.jeDach[form].deckung, detailId: detail.id, ansicht: aufgabe.ansicht, version: 1 } };
}
export function dachHilfe(s: DachErkundungStand, detailId: string, art: string, now = Date.now()): DachErkundungStand {
  if (!getDachDetail(detailId) || !text(art, 500)) throw new Error("Diese Dachhilfe ist nicht verfügbar.");
  const neu = bearbeiten(s, now), zuletzt = neu.hilfeEreignisse.at(-1);
  if (zuletzt?.detailId === detailId && zuletzt.art === art && neu.aktualisiertAm - zuletzt.am < 1000) return clone(s);
  if (neu.hilfeEreignisse.length >= 10000) throw new Error("Bitte sichere deinen Dachlernstand vor weiteren Hilfeöffnungen.");
  neu.hilfeEreignisse.push({ detailId, art, am: neu.aktualisiertAm });
  for (const a of Object.values(neu.antworten)) if (a.aufgabe.detailId === detailId && !a.geprueft) {
    a.hilfen = [...new Set([...a.hilfen, art])]; a.nachErklaerung = true;
  }
  return neu;
}
export function pruefeDachAufgabe(s: DachErkundungStand, aufgabeId: string, now = Date.now()): DachErkundungStand {
  const neu = bearbeiten(s, now);
  const original = s.antworten[aufgabeId];
  if (!original) throw new Error("Öffne und bearbeite die Dachaufgabe zuerst.");
  if (original.geprueft) return clone(s);
  const wertung = bewerteDachAntwort(original.aufgabe, original.auswahl);
  if (wertung === null) throw new Error("Wähle zuerst eine gültige Antwort aus.");
  const a = neu.antworten[aufgabeId], detailId = a.aufgabe.detailId;
  const hilfen = zeitnaheHilfen(s, detailId, neu.aktualisiertAm);
  const form = a.medienRef?.form ?? s.form;
  if (s.jeDach[form].modus === "begleitet") hilfen.push("begleitung");
  a.hilfen = [...new Set([...a.hilfen, ...hilfen])];
  a.nachErklaerung = a.nachErklaerung || hilfen.length > 0;
  a.ersteAuswahl = [...a.auswahl]; a.geprueft = true; a.bewertung = wertung; a.abgegebenAm = neu.aktualisiertAm;
  return neu;
}

/** Public helper for review normalization; never mutates the source record. */
export function dachDetailZeitnahErklaert(detailId: string, am = Date.now(), versuchId?: string): boolean {
  const s = ladeDachStand();
  return s ? zeitnaheHilfen(s, detailId, am, versuchId).length > 0 : zeitnaheTagesAntworten(detailId, am, versuchId).length > 0;
}
export const DACH_AUFGABEN = () => DACH_DETAILS.flatMap(d => d.aufgaben);
