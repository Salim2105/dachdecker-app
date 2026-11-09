import inhalte from "@/content/praxisvideos-inhalte.json";
import archiv from "@/content/praxisvideos-archiv.json";
import { DACH_MODELLE } from "@/lib/dach3dInhalte";
import type { DachDeckung, DachForm } from "@/lib/dach3dTypen";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import type { WerkstattPfadId } from "@/lib/werkstattTypen";
import type { PraxisVideo, PraxisVideoKontext, PraxisVideoRef, PraxisVideoVersion, PraxisVideoLernpunkt } from "@/lib/praxisVideoTypen";

export const PRAXIS_VIDEO_HANDGRIFFE = ["schnitt", "bearbeiten", "verlegen", "kontrolle"] as const;
export const PRAXIS_VIDEO_V2_LERNPUNKTE: Readonly<Record<string, PraxisVideoLernpunkt>> = Object.fromEntries(
  ([ ["schnitt", "schritt-2", "a"], ["bearbeiten", "schritt-3", "b"], ["verlegen", "schritt-1", "a"] ] as const).map(([slug, kapitelId, aufgabe]) => {
    const id = `werkstatt-falzziegel-${slug}`;
    return [id, { id: `${id}-mitmachen`, kapitelId, einheitId: id, aufgabeId: `${id}-${aufgabe}` }];
  }),
);
export function istPraxisVideoVersion(id: string, version: unknown): version is PraxisVideoVersion {
  return istPraxisVideoId(id) && (version === 1 || version === 2 && Object.hasOwn(PRAXIS_VIDEO_V2_LERNPUNKTE, id));
}
/** The release catalogue follows current roof contexts, without changing frozen attempts. */
export const PRAXIS_VIDEO_KONTEXTE: readonly PraxisVideoKontext[] = [
  ...DACH_MODELLE.flatMap(m => m.deckungen.flatMap(deckung => m.detailIds.map(detailId => ({
    id: `dach-${m.id}-${deckung}-${detailId}`, typ: "dachdetail" as const, form: m.id, deckung, detailId,
  })))),
  ...WERKSTATT_PFADE.flatMap(p => PRAXIS_VIDEO_HANDGRIFFE.map(slug => ({
    id: `werkstatt-${p.id}-${slug}`, typ: "handgriff" as const, pfadId: p.id, slug,
  }))),
];
const kontexte = new Map(PRAXIS_VIDEO_KONTEXTE.map(k => [k.id, k]));
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 50_000): v is string => typeof v === "string" && !!v.trim() && v.length <= max;
const kontextFelder = ["typ", "form", "deckung", "detailId", "pfadId", "slug"] as const;

export function istPraxisVideoId(id: unknown): id is string { return typeof id === "string" && kontexte.has(id); }
export function istPraxisVideo(v: unknown): v is PraxisVideo {
  if (!obj(v) || !istPraxisVideoId(v.id) || !istPraxisVideoVersion(v.id, v.version) || !text(v.titel, 300) || !text(v.transkript) ||
      typeof v.dauer !== "number" || !Number.isFinite(v.dauer) || v.dauer <= 0 || v.dauer > 1800 ||
      !Array.isArray(v.kapitel) || !v.kapitel.length || v.kapitel.length > 100) return false;
  const kontext = kontexte.get(v.id)!;
  if (!kontextFelder.every(f => v[f] === kontext[f])) return false;
  const ids = new Set<string>(); let ende = 0;
  for (const k of v.kapitel) {
    if (!obj(k) || !text(k.id, 100) || !/^[a-z0-9][a-z0-9-]*$/.test(k.id) || ids.has(k.id) || !text(k.titel, 300) || !text(k.text) ||
        typeof k.start !== "number" || !Number.isFinite(k.start) || k.start < ende || typeof k.ende !== "number" || !Number.isFinite(k.ende) ||
        k.ende <= k.start || k.ende > v.dauer) return false;
    ids.add(k.id); ende = k.ende;
  }
  if (v.version === 1) return v.lernpunkte === undefined;
  const lernpunkt = PRAXIS_VIDEO_V2_LERNPUNKTE[v.id];
  if (!Array.isArray(v.lernpunkte) || v.lernpunkte.length !== 1 || !obj(v.lernpunkte[0])) return false;
  const referenz = v.lernpunkte[0];
  return Object.keys(referenz).length === 4 &&
    (Object.keys(lernpunkt) as (keyof PraxisVideoLernpunkt)[]).every(k => referenz[k] === lernpunkt[k]) &&
    ids.has(lernpunkt.kapitelId);
}
export function istPraxisVideoRef(v: unknown): v is PraxisVideoRef {
  return obj(v) && istPraxisVideoId(v.videoId) && istPraxisVideoVersion(v.videoId, v.version) && !!getPraxisVideo(v.videoId, v.version);
}
export function pruefePraxisVideoInhalte(v: unknown, options: { allowEmpty?: boolean } = {}): v is { version: 1; videos: PraxisVideo[] } {
  return obj(v) && v.version === 1 && Array.isArray(v.videos) && v.videos.every(istPraxisVideo) &&
    new Set(v.videos.map(clip => clip.id)).size === v.videos.length &&
    (v.videos.length === PRAXIS_VIDEO_KONTEXTE.length || options.allowEmpty === true && v.videos.length === 0);
}
export const PRAXIS_VIDEOS: PraxisVideo[] = (() => {
  const v: unknown = inhalte;
  if (!pruefePraxisVideoInhalte(v, { allowEmpty: process.env.NODE_ENV !== "production" })) throw new Error("Das Verzeichnis der Praxisvideos ist unvollständig oder ungültig.");
  return v.videos;
})();
export const PRAXIS_VIDEO_ARCHIV: readonly PraxisVideo[] = (() => {
  const v: unknown = archiv;
  if (!obj(v) || v.version !== 1 || !Array.isArray(v.videos) || v.videos.length !== 3 ||
      !v.videos.every(c => istPraxisVideo(c) && c.version === 1 && Object.hasOwn(PRAXIS_VIDEO_V2_LERNPUNKTE, c.id)) ||
      new Set(v.videos.map(c => c.id)).size !== 3) throw new Error("Das Archiv der Praxisvideos ist ungültig.");
  return v.videos;
})();
export function getPraxisVideo(id: string, version?: PraxisVideoVersion): PraxisVideo | undefined {
  const aktuell = PRAXIS_VIDEOS.find(v => v.id === id);
  return version === undefined || aktuell?.version === version ? aktuell : PRAXIS_VIDEO_ARCHIV.find(v => v.id === id && v.version === version);
}
export function getVorherigePraxisVideoFassung(video: PraxisVideo): PraxisVideo | undefined {
  return video.version === 2 ? getPraxisVideo(video.id, 1) : undefined;
}
export function getDachPraxisVideo(form: DachForm, deckung: DachDeckung, detailId: string): PraxisVideo | undefined {
  const video = getPraxisVideo(`dach-${form}-${deckung}-${detailId}`);
  return video?.typ === "dachdetail" && video.form === form && video.deckung === deckung && video.detailId === detailId ? video : undefined;
}
export function getDachPraxisVideos(form: DachForm, deckung?: DachDeckung): PraxisVideo[] {
  return PRAXIS_VIDEOS.filter(v => v.typ === "dachdetail" && v.form === form && (!deckung || v.deckung === deckung));
}
export function getWerkstattPraxisVideo(pfadId: WerkstattPfadId, slug: string): PraxisVideo | undefined {
  const video = getPraxisVideo(`werkstatt-${pfadId}-${slug}`);
  return video?.typ === "handgriff" && video.pfadId === pfadId && video.slug === slug ? video : undefined;
}
