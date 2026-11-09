import type { DachDeckung, DachForm } from "@/lib/dach3dTypen";
import type { WerkstattPfadId } from "@/lib/werkstattTypen";

export interface PraxisVideoKapitel { id: string; titel: string; start: number; ende: number; text: string }
export type PraxisVideoVersion = 1 | 2;
export interface PraxisVideoLernpunkt { id: string; kapitelId: string; einheitId: string; aufgabeId: string }
export interface PraxisVideoKontext {
  id: string; typ: "dachdetail" | "handgriff";
  form?: DachForm; deckung?: DachDeckung; detailId?: string;
  pfadId?: WerkstattPfadId; slug?: string;
}
export interface PraxisVideo extends PraxisVideoKontext {
  version: PraxisVideoVersion; titel: string; dauer: number; kapitel: PraxisVideoKapitel[]; transkript: string;
  lernpunkte?: PraxisVideoLernpunkt[];
}
export interface PraxisVideoRef { videoId: string; version: PraxisVideoVersion }
export interface PraxisVideoAsset { id: string; url: string; bytes: number; sha256: string; typ: "video" | "untertitel" | "bild" }
export interface PraxisVideoPaket { id: string; titel: string; assets: PraxisVideoAsset[]; bytes: number }
export interface PraxisVideoEinstellungen { sprecher: boolean; untertitel: boolean }
export interface PraxisVideoPosition { version: 1; videoId: string; videoVersion: PraxisVideoVersion; position: number; aktualisiertAm: number }
