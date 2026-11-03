import manifest from "@/content/praxisvideos-medien.json";
import { DACH_MODELLE } from "@/lib/dach3dInhalte";
import type { DachForm } from "@/lib/dach3dTypen";
import { getPraxisVideo, getDachPraxisVideos, istPraxisVideoId, PRAXIS_VIDEO_KONTEXTE } from "@/lib/praxisVideoInhalte";
import type { PraxisVideo, PraxisVideoAsset, PraxisVideoPaket } from "@/lib/praxisVideoTypen";

export const PRAXIS_VIDEO_PREFIX = "/praxisvideos/v1/";
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export function istPraxisVideoMedienPfad(id: unknown): id is string {
  if (typeof id !== "string" || id.length > 200 || !/^[a-z0-9-]+\.(?:mp4|vtt|webp)$/.test(id)) return false;
  return istPraxisVideoId(id.replace(/\.(?:mp4|vtt|webp)$/, ""));
}
export function istPraxisVideoAsset(v: unknown): v is PraxisVideoAsset {
  return obj(v) && istPraxisVideoMedienPfad(v.id) && v.url === `${PRAXIS_VIDEO_PREFIX}${v.id}` &&
    Number.isSafeInteger(v.bytes) && Number(v.bytes) > 0 && Number(v.bytes) <= (v.id.endsWith(".mp4") ? 15 : 2) * 1024 * 1024 &&
    typeof v.sha256 === "string" && /^[a-f0-9]{64}$/.test(v.sha256) && !/^([a-f0-9])\1{63}$/.test(v.sha256) &&
    v.typ === (v.id.endsWith(".mp4") ? "video" : v.id.endsWith(".vtt") ? "untertitel" : "bild");
}
export function pruefePraxisVideoMedien(v: unknown, options: { allowEmpty?: boolean } = {}): v is { version: 1; assets: PraxisVideoAsset[] } {
  if (!obj(v) || v.version !== 1 || !Array.isArray(v.assets) || !v.assets.every(istPraxisVideoAsset) ||
      new Set(v.assets.map(a => a.id)).size !== v.assets.length) return false;
  if (!v.assets.length) return options.allowEmpty === true;
  const ids = new Set(v.assets.map(a => a.id));
  return PRAXIS_VIDEO_KONTEXTE.every(k => ["mp4", "vtt", "webp"].every(ext => ids.has(`${k.id}.${ext}`)));
}
export const PRAXIS_VIDEO_MEDIEN: PraxisVideoAsset[] = (() => {
  const v: unknown = manifest;
  if (!pruefePraxisVideoMedien(v, { allowEmpty: process.env.NODE_ENV !== "production" })) throw new Error("Das Verzeichnis der Praxisvideodateien ist unvollständig oder ungültig.");
  return v.assets;
})();
export function praxisVideoMedien(clip: PraxisVideo | string): { video?: PraxisVideoAsset; untertitel?: PraxisVideoAsset; poster?: PraxisVideoAsset; assets: PraxisVideoAsset[] } {
  const id = typeof clip === "string" ? clip : clip.id;
  if (!istPraxisVideoId(id)) throw new Error("Dieses Praxisvideo ist nicht bekannt.");
  const assets = PRAXIS_VIDEO_MEDIEN.filter(a => a.id.startsWith(`${id}.`));
  return { video: assets.find(a => a.typ === "video"), untertitel: assets.find(a => a.typ === "untertitel"), poster: assets.find(a => a.typ === "bild"), assets };
}
export function praxisVideoClipPaket(clip: PraxisVideo | string): PraxisVideoPaket {
  const id = typeof clip === "string" ? clip : clip.id;
  const assets = praxisVideoMedien(id).assets;
  return { id: `clip-${id}`, titel: getPraxisVideo(id)?.titel ?? id, assets, bytes: assets.reduce((s, a) => s + a.bytes, 0) };
}
export function praxisVideoDachPaket(form: DachForm): PraxisVideoPaket {
  const modell = DACH_MODELLE.find(m => m.id === form);
  if (!modell) throw new Error("Diese Dachform ist nicht bekannt.");
  const assets = getDachPraxisVideos(form).flatMap(v => praxisVideoMedien(v).assets);
  return { id: `dach-${form}`, titel: `${modell.titel}: Praxisvideos`, assets, bytes: assets.reduce((s, a) => s + a.bytes, 0) };
}
export function istPraxisVideoPaketId(id: unknown): id is string {
  return typeof id === "string" && (DACH_MODELLE.some(m => id === `dach-${m.id}`) || id.startsWith("clip-") && istPraxisVideoId(id.slice(5)));
}
export function gehoertPraxisVideoAssetZu(asset: PraxisVideoAsset, paketId: string): boolean {
  const clipId = asset.id.replace(/\.(?:mp4|vtt|webp)$/, "");
  return paketId === `clip-${clipId}` || PRAXIS_VIDEO_KONTEXTE.some(k => k.id === clipId && k.typ === "dachdetail" && paketId === `dach-${k.form}`);
}
export function istPraxisVideoPaket(v: unknown): v is PraxisVideoPaket {
  if (!obj(v) || !istPraxisVideoPaketId(v.id) || typeof v.titel !== "string" || !v.titel.trim() || !Array.isArray(v.assets) ||
      !v.assets.length || v.assets.length > 1000 || !v.assets.every(a => istPraxisVideoAsset(a) && gehoertPraxisVideoAssetZu(a, v.id as string)) ||
      new Set(v.assets.map(a => a.id)).size !== v.assets.length || v.bytes !== v.assets.reduce((s, a) => s + a.bytes, 0)) return false;
  const ids = new Set(v.assets.map(a => a.id));
  const kontexte = PRAXIS_VIDEO_KONTEXTE.filter(k => v.id === `clip-${k.id}` || k.typ === "dachdetail" && v.id === `dach-${k.form}`);
  return kontexte.every(k => ["mp4", "vtt", "webp"].every(ext => ids.has(`${k.id}.${ext}`)));
}
