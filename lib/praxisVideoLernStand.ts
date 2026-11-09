import { appStorage } from "@/lib/lernSpeicher";
import type { PraxisVideo, PraxisVideoVersion } from "@/lib/praxisVideoTypen";

export const praxisVideoLernStaendeKey = "praxisvideo-lernen-v1";
export type PraxisVideoLernModus = "anschauen" | "mitmachen";
export type PraxisVideoLernpunktStatus = "offen" | "bearbeitet" | "uebersprungen";
export interface PraxisVideoLernStand {
  version: 1; versuchId: string; videoId: string; videoVersion: PraxisVideoVersion;
  modus: PraxisVideoLernModus; lernpunkte: Record<string, PraxisVideoLernpunktStatus>;
  aktivLernpunktId: string | null; aktualisiertAm: number;
}
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const muster = /^werkstatt-falzziegel-(?:schnitt|bearbeiten|verlegen)$/;
export const praxisVideoLernStandKey = (versuchId: string, videoId: string, version: PraxisVideoVersion) => JSON.stringify([versuchId, videoId, version]);
export function istPraxisVideoLernStand(v: unknown): v is PraxisVideoLernStand {
  if (!obj(v) || v.version !== 1 || typeof v.versuchId !== "string" || !v.versuchId || v.versuchId.length > 500 || typeof v.videoId !== "string" || !muster.test(v.videoId) || v.videoVersion !== 2 ||
      !["anschauen", "mitmachen"].includes(String(v.modus)) || !obj(v.lernpunkte) || Object.keys(v.lernpunkte).length !== 1 ||
      !(v.aktivLernpunktId === null || typeof v.aktivLernpunktId === "string" && Object.hasOwn(v.lernpunkte, v.aktivLernpunktId)) ||
      typeof v.aktualisiertAm !== "number" || !Number.isFinite(v.aktualisiertAm) || v.aktualisiertAm < 0) return false;
  return Object.entries(v.lernpunkte).every(([id, status]) => id === `${v.videoId}-mitmachen` && ["offen", "bearbeitet", "uebersprungen"].includes(String(status)));
}
export function istPraxisVideoLernStaende(v: unknown): v is Record<string, PraxisVideoLernStand> {
  return obj(v) && Object.keys(v).length <= 5000 && Object.entries(v).every(([key, stand]) => istPraxisVideoLernStand(stand) && key === praxisVideoLernStandKey(stand.versuchId, stand.videoId, stand.videoVersion));
}
function alle(): Record<string, PraxisVideoLernStand> {
  const raw = appStorage.getItem(praxisVideoLernStaendeKey);
  if (raw === null) return {};
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error("Dein gespeicherter Video-Lernstand ist nicht lesbar. Er bleibt für eine Sicherung erhalten."); }
  if (!istPraxisVideoLernStaende(data)) throw new Error("Dein gespeicherter Video-Lernstand ist ungültig. Er bleibt für eine Sicherung erhalten.");
  return data;
}
export function neuerPraxisVideoLernStand(versuchId: string, video: PraxisVideo): PraxisVideoLernStand {
  return { version: 1, versuchId, videoId: video.id, videoVersion: video.version, modus: "anschauen", lernpunkte: Object.fromEntries((video.lernpunkte ?? []).map(p => [p.id, "offen"])), aktivLernpunktId: null, aktualisiertAm: Date.now() };
}
export function ladePraxisVideoLernStand(versuchId: string, video: PraxisVideo): PraxisVideoLernStand {
  const stand = alle()[praxisVideoLernStandKey(versuchId, video.id, video.version)];
  return stand ? { ...stand, lernpunkte: { ...stand.lernpunkte } } : neuerPraxisVideoLernStand(versuchId, video);
}
export function speicherePraxisVideoLernStand(stand: PraxisVideoLernStand): PraxisVideoLernStand {
  if (!istPraxisVideoLernStand(stand)) throw new Error("Der Video-Lernstand konnte nicht gespeichert werden.");
  const alt = alle(), gespeichert = { ...stand, aktualisiertAm: Date.now() };
  appStorage.setItem(praxisVideoLernStaendeKey, JSON.stringify({ ...alt, [praxisVideoLernStandKey(stand.versuchId, stand.videoId, stand.videoVersion)]: gespeichert }));
  return gespeichert;
}
/** HOME reads must not repair or overwrite an unreadable backup. */
export function offenerPraxisVideoLernStand(versuchId: string, videoId: string): PraxisVideoLernStand | undefined {
  try { return Object.values(alle()).find(s => s.versuchId === versuchId && s.videoId === videoId && s.modus === "mitmachen" && s.aktivLernpunktId !== null); }
  catch { return undefined; }
}
