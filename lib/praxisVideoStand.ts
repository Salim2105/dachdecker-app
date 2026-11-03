import { appStorage } from "@/lib/lernSpeicher";
import { getPraxisVideo, istPraxisVideoId } from "@/lib/praxisVideoInhalte";
import type { PraxisVideoEinstellungen, PraxisVideoPosition } from "@/lib/praxisVideoTypen";

export const praxisVideoEinstellungenKey = "praxisvideo-einstellungen-v1";
export const praxisVideoPositionenKey = "praxisvideo-positionen-v1";
const einstellungenListeners = new Set<() => void>();
export const subscribePraxisVideoEinstellungen = (listener: () => void): (() => void) => {
  einstellungenListeners.add(listener); return () => { einstellungenListeners.delete(listener); };
};
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export function istPraxisVideoEinstellungen(v: unknown): v is PraxisVideoEinstellungen {
  return obj(v) && typeof v.sprecher === "boolean" && typeof v.untertitel === "boolean" && Object.keys(v).length === 2;
}
export function istPraxisVideoPosition(v: unknown): v is PraxisVideoPosition {
  if (!obj(v) || v.version !== 1 || v.videoVersion !== 1 || !istPraxisVideoId(v.videoId) ||
      typeof v.position !== "number" || !Number.isFinite(v.position) || v.position < 0 || v.position > 1800 ||
      typeof v.aktualisiertAm !== "number" || !Number.isFinite(v.aktualisiertAm) || v.aktualisiertAm < 0) return false;
  const clip = getPraxisVideo(v.videoId);
  return !clip || v.videoVersion === clip.version && v.position <= clip.dauer;
}
export function istPraxisVideoPositionen(v: unknown): v is Record<string, PraxisVideoPosition> {
  return obj(v) && Object.keys(v).length <= 1000 && Object.entries(v).every(([id, p]) => istPraxisVideoPosition(p) && p.videoId === id);
}
function json(key: string): unknown {
  try { return JSON.parse(appStorage.getItem(key) ?? "null"); } catch { return null; }
}
export function ladePraxisVideoEinstellungen(): PraxisVideoEinstellungen {
  const v = json(praxisVideoEinstellungenKey);
  return istPraxisVideoEinstellungen(v) ? { ...v } : { sprecher: true, untertitel: true };
}
export function speicherePraxisVideoEinstellungen(v: PraxisVideoEinstellungen): PraxisVideoEinstellungen {
  if (!istPraxisVideoEinstellungen(v)) throw new Error("Die Videoeinstellungen sind ungültig.");
  appStorage.setItem(praxisVideoEinstellungenKey, JSON.stringify(v));
  einstellungenListeners.forEach(listener => listener()); return { ...v };
}
export function ladePraxisVideoPosition(videoId: string): PraxisVideoPosition | null {
  const v = json(praxisVideoPositionenKey);
  return istPraxisVideoPositionen(v) && Object.hasOwn(v, videoId) ? { ...v[videoId] } : null;
}
export function speicherePraxisVideoPosition(videoId: string, position: number): PraxisVideoPosition {
  if (!Number.isFinite(position) || position < 0) throw new Error("Die Videoposition ist ungültig.");
  const clip = getPraxisVideo(videoId);
  const neu: PraxisVideoPosition = { version: 1, videoId, videoVersion: 1, position: Math.min(position, clip?.dauer ?? 1800), aktualisiertAm: Date.now() };
  if (!istPraxisVideoPosition(neu)) throw new Error("Die Videoposition ist ungültig.");
  const alt = json(praxisVideoPositionenKey), positionen = istPraxisVideoPositionen(alt) ? alt : {};
  appStorage.setItem(praxisVideoPositionenKey, JSON.stringify({ ...positionen, [videoId]: neu })); return neu;
}
