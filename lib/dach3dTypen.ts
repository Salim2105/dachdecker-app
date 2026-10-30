import type { Bewertung } from "@/content/schema";

export type DachForm = "steildach" | "walmdach" | "flachdach";
export type DachDeckung = "falzziegel" | "biber-doppel" | "warmdach";
export type DachGruppe = "aufbau" | "dachraender" | "oeffnungen" | "entwaesserung" | "ausstattung";
export type DachAnsicht = "nah" | "schnitt" | "aufbau";
export type DachPhase = "erkennen" | "aufbau" | "montage" | "kontrolle" | "aufgaben";
export interface DachAufgabe {
  id: string; version: number; detailId: string; titel: string; frage: string;
  optionen: { id: string; text: string; korrekt: boolean }[];
  erklaerung: string; lernzielIds: string[]; ansicht: DachAnsicht;
}
export interface DachDetail {
  id: string; version: number; titel: string; gruppe: DachGruppe; formen: DachForm[];
  lfIds: string[]; lernzielIds: string[]; funktion: string; aufbau: string[];
  bauteile: { id: string; name: string; funktion: string }[];
  schritte: { id: string; titel: string; handlung: string; warum: string; kontrolle: string; ansicht: DachAnsicht }[];
  kontrolle: { richtig: string; fehler: string; korrektur: string; kriterien: string[] };
  aufgaben: [DachAufgabe, DachAufgabe]; werkstattIds: string[]; quellen: string[];
}
export interface DachModell {
  id: DachForm; titel: string; kurz: string; deckungen: DachDeckung[]; detailIds: string[];
  systemkarte: { titel: string; beschreibung: string; angaben: string[]; grenzen: string[] };
}
export interface MedienAsset { id: string; url: string; bytes: number; sha256: string; typ: "modell" | "bild" }
export interface DachMedienRef { form: DachForm; deckung: DachDeckung; detailId: string; ansicht: DachAnsicht; version: 1 }
export interface DachAntwort {
  versuchId: string; aufgabe: DachAufgabe; auswahl: string[]; ersteAuswahl?: string[];
  geprueft: boolean; bewertung?: Bewertung; abgegebenAm?: number; hilfen: string[];
  nachErklaerung: boolean; medienRef: DachMedienRef;
}
export interface DachPosition {
  deckung: DachDeckung; detailId: string | null; phase: DachPhase; schritt: number;
  ansicht: DachAnsicht; schichten: string[]; kamera: "gesamt" | "nah" | "seite" | "oben";
  modus: "begleitet" | "probelauf"; wasser: number;
  orbit?: { position: [number, number, number]; target: [number, number, number] };
}
export interface DachErkundungStand {
  version: 1; id: string; revision: number; erstelltAm: number; aktualisiertAm: number;
  form: DachForm; jeDach: Record<DachForm, DachPosition>;
  antworten: Record<string, DachAntwort>; notizen: Record<string, string>;
  hilfeEreignisse: { detailId: string; art: string; am: number }[];
}
