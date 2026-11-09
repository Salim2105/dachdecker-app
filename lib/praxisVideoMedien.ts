import manifest from "@/content/praxisvideos-medien.json";
import archiv from "@/content/praxisvideos-archiv.json";
import { DACH_MODELLE } from "@/lib/dach3dInhalte";
import type { DachForm } from "@/lib/dach3dTypen";
import { getPraxisVideo, getDachPraxisVideos, istPraxisVideoId, istPraxisVideoVersion, PRAXIS_VIDEO_KONTEXTE, PRAXIS_VIDEO_V2_LERNPUNKTE } from "@/lib/praxisVideoInhalte";
import type { PraxisVideo, PraxisVideoAsset, PraxisVideoPaket, PraxisVideoVersion } from "@/lib/praxisVideoTypen";

export const PRAXIS_VIDEO_PREFIX = "/praxisvideos/v1/";
export function praxisVideoAssetVersion(asset: { url: unknown }): PraxisVideoVersion | undefined {
  if (typeof asset.url !== "string") return undefined;
  const match = /^\/praxisvideos\/v([12])\/[a-z0-9-]+\.(?:mp4|vtt|webp)$/.exec(asset.url);
  return match ? Number(match[1]) as PraxisVideoVersion : undefined;
}
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export function istPraxisVideoMedienPfad(id: unknown): id is string {
  if (typeof id !== "string" || id.length > 200 || !/^[a-z0-9-]+\.(?:mp4|vtt|webp)$/.test(id)) return false;
  return istPraxisVideoId(id.replace(/\.(?:mp4|vtt|webp)$/, ""));
}
export function istPraxisVideoAsset(v: unknown): v is PraxisVideoAsset {
  if (!obj(v) || !istPraxisVideoMedienPfad(v.id)) return false;
  const version = praxisVideoAssetVersion({ url: v.url });
  return version !== undefined && istPraxisVideoVersion(v.id.replace(/\.(?:mp4|vtt|webp)$/, ""), version) && v.url === `/praxisvideos/v${version}/${v.id}` &&
    Number.isSafeInteger(v.bytes) && Number(v.bytes) > 0 && Number(v.bytes) <= (v.id.endsWith(".mp4") ? version === 2 ? 25 : 15 : 2) * 1024 * 1024 &&
    typeof v.sha256 === "string" && /^[a-f0-9]{64}$/.test(v.sha256) && !/^([a-f0-9])\1{63}$/.test(v.sha256) &&
    v.typ === (v.id.endsWith(".mp4") ? "video" : v.id.endsWith(".vtt") ? "untertitel" : "bild");
}
export function pruefePraxisVideoMedien(v: unknown, options: { allowEmpty?: boolean } = {}): v is { version: 1; assets: PraxisVideoAsset[] } {
  if (!obj(v) || v.version !== 1 || !Array.isArray(v.assets) || !v.assets.every(a => istPraxisVideoAsset(a) && praxisVideoAssetVersion(a) === getPraxisVideo(a.id.replace(/\.(?:mp4|vtt|webp)$/, ""))?.version) ||
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
export const PRAXIS_VIDEO_ARCHIV_MEDIEN: readonly PraxisVideoAsset[] = (() => {
  const v: unknown = archiv;
  if (!obj(v) || v.version !== 1 || !Array.isArray(v.assets) || v.assets.length !== 9 ||
      !v.assets.every(a => istPraxisVideoAsset(a) && praxisVideoAssetVersion(a) === 1 && Object.hasOwn(PRAXIS_VIDEO_V2_LERNPUNKTE, a.id.replace(/\.(?:mp4|vtt|webp)$/, ""))) ||
      new Set(v.assets.map(a => a.id)).size !== 9) throw new Error("Das Medienarchiv der Praxisvideos ist ungültig.");
  return v.assets;
})();
export function praxisVideoMedien(clip: PraxisVideo | string): { video?: PraxisVideoAsset; untertitel?: PraxisVideoAsset; poster?: PraxisVideoAsset; assets: PraxisVideoAsset[] } {
  const id = typeof clip === "string" ? clip : clip.id;
  const version = typeof clip === "string" ? getPraxisVideo(id)?.version : clip.version;
  if (!istPraxisVideoId(id) || !version || !getPraxisVideo(id, version)) throw new Error("Dieses Praxisvideo ist nicht bekannt.");
  const passend = (a: PraxisVideoAsset) => a.id.startsWith(`${id}.`) && praxisVideoAssetVersion(a) === version;
  const aktuelle = PRAXIS_VIDEO_MEDIEN.filter(passend);
  const assets = aktuelle.length ? aktuelle : PRAXIS_VIDEO_ARCHIV_MEDIEN.filter(passend);
  return { video: assets.find(a => a.typ === "video"), untertitel: assets.find(a => a.typ === "untertitel"), poster: assets.find(a => a.typ === "bild"), assets };
}
export function praxisVideoClipPaket(clip: PraxisVideo | string): PraxisVideoPaket {
  const id = typeof clip === "string" ? clip : clip.id;
  const assets = praxisVideoMedien(clip).assets;
  return { id: `clip-${id}`, titel: (typeof clip === "string" ? getPraxisVideo(id) : clip)?.titel ?? id, assets, bytes: assets.reduce((s, a) => s + a.bytes, 0) };
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
  const paketAssets: PraxisVideoAsset[] = v.assets;
  const ids = new Set(paketAssets.map(a => a.id));
  const kontexte = PRAXIS_VIDEO_KONTEXTE.filter(k => v.id === `clip-${k.id}` || k.typ === "dachdetail" && v.id === `dach-${k.form}`);
  return kontexte.every(k => {
    const assets = paketAssets.filter(a => a.id.startsWith(`${k.id}.`));
    return ["mp4", "vtt", "webp"].every(ext => ids.has(`${k.id}.${ext}`)) && new Set(assets.map(praxisVideoAssetVersion)).size === 1;
  });
}
