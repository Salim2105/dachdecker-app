import inhalte from "@/content/praxisvideos-inhalte.json";
import { DACH_MODELLE } from "@/lib/dach3dInhalte";
import type { DachDeckung, DachForm } from "@/lib/dach3dTypen";
import { WERKSTATT_PFADE } from "@/lib/werkstattInhalte";
import type { WerkstattPfadId } from "@/lib/werkstattTypen";
import type { PraxisVideo, PraxisVideoKontext, PraxisVideoRef } from "@/lib/praxisVideoTypen";

export const PRAXIS_VIDEO_HANDGRIFFE = ["schnitt", "bearbeiten", "verlegen", "kontrolle"] as const;
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
  if (!obj(v) || !istPraxisVideoId(v.id) || v.version !== 1 || !text(v.titel, 300) || !text(v.transkript) ||
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
  return true;
}
export function istPraxisVideoRef(v: unknown): v is PraxisVideoRef {
  return obj(v) && v.version === 1 && istPraxisVideoId(v.videoId);
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
export const getPraxisVideo = (id: string): PraxisVideo | undefined => PRAXIS_VIDEOS.find(v => v.id === id);
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
