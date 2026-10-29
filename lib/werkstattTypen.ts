import type { Aktivitaet, AktivitaetAntwort } from "@/lib/aktivitaeten";
import type { KompetenzId } from "@/lib/pruefungsVorbereitungTypen";

export type WerkstattPfadId = "falzziegel" | "biber-doppel";
export type WerkstattSzene = "messen" | "ziegel" | "laengen" | "breiten" | "wasser" | "verlegen" | "schnitt" | "bearbeiten" | "befestigen" | "kontrolle" | "kronenvergleich";
export type WerkstattAnsicht = "draufsicht" | "schnitt" | "einzelziegel";
export interface WerkstattSystemkarte {
  id: string; version: number; pfadId: WerkstattPfadId; titel: string; hinweis: string;
  /** All dimensions in centimetres, explicitly fictional school-model data. */
  masse: { feldLaenge: number; feldBreite: number; ziegelLaenge: number; ziegelBreite: number; deckLaenge: number; deckBreite: number; minDeckLaenge: number; maxDeckLaenge: number; kopfUeberdeckung: number; reihen: number; spalten: number };
  angaben: string[]; befestigung: string[]; quellen: string[];
}
export interface WerkstattBildschritt {
  id: string; titel: string; handlung: string; warum: string; kontrolle: string;
  szene: WerkstattSzene; ansicht: WerkstattAnsicht;
}
interface AufgabeBasis {
  id: string; titel: string; auftrag: string; hinweis: string; erklaerung: string;
  kompetenzen: KompetenzId[]; szene: WerkstattSzene;
}
export interface WerkstattPunkt { id: string; x: number; y: number; label: string }
export interface WerkstattAnzeichnen extends AufgabeBasis {
  typ: "anzeichnen"; modus: "messstrecke" | "schnitt";
  punkte: WerkstattPunkt[]; loesung: [string, string]; nutzseite?: "links" | "rechts";
}
export interface WerkstattEinteilen extends AufgabeBasis {
  typ: "einteilen"; richtung: "laenge" | "breite"; strecke: number;
  zielAnzahl: number; minAbstand: number; maxAbstand: number; zielVersatz: number; toleranz: number;
}
export interface WerkstattVerlegen extends AufgabeBasis {
  typ: "verlegen"; ziele: WerkstattPunkt[];
  teile: { id: string; label: string; zielId: string }[]; reihenfolge: boolean;
}
export interface WerkstattAktivitaet extends AufgabeBasis { typ: "aktivitaet"; aktivitaet: Aktivitaet }
export type WerkstattAufgabe = WerkstattAnzeichnen | WerkstattEinteilen | WerkstattVerlegen | WerkstattAktivitaet;
export interface WerkstattPraxis {
  auftrag: string; werkzeuge: string[]; material: string[]; ablauf: string[];
  sicherheit: string[]; kontrolle: string[]; gespraech: string[];
}
export interface WerkstattEinheit {
  id: string; version: number; pfadId: WerkstattPfadId; slug: string; nummer: number;
  titel: string; lernziel: string; minuten: number; lernzielIds: string[]; lfIds: string[];
  systemkarte: WerkstattSystemkarte; bildschritte: WerkstattBildschritt[];
  aufgaben: [WerkstattAufgabe, WerkstattAufgabe]; praxis: WerkstattPraxis; wiederholungId: string;
}
export interface WerkstattPfad { id: WerkstattPfadId; version: number; titel: string; kurz: string; systemkarte: WerkstattSystemkarte; einheiten: WerkstattEinheit[] }
export interface WerkstattAntwort {
  punkte: string[]; nutzseite: "" | "links" | "rechts"; anzahl: string; versatz: string;
  belegung: Record<string, string>; folge: string[]; aktivitaet: AktivitaetAntwort;
}
export interface WerkstattBewertung { erreicht: number; moeglich: number; richtig: boolean; hinweise: string[] }
export interface WerkstattAbgabe {
  id: string; am: number; antwort: WerkstattAntwort; bewertung: WerkstattBewertung;
  hilfen: string[]; nachErklaerung: boolean; modus: "begleitet" | "probelauf";
}
export interface WerkstattStand {
  version: 1; id: string; revision: number; erstelltAm: number; aktualisiertAm: number;
  einheit: WerkstattEinheit; modus: "begleitet" | "probelauf";
  phase: "anleitung" | "uebung" | "praxis"; schritt: number; aufgabeIndex?: number; ansicht: WerkstattAnsicht; wasser: number;
  antworten: Record<string, WerkstattAntwort>; abgaben: Record<string, WerkstattAbgabe[]>;
  geprueft: string[]; gesehen: string[]; hilfen: string[]; notiz: string; abgeschlossenAm: number | null;
}
