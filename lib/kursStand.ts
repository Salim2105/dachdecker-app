import type { Bewertung } from "@/content/schema";
import type { LernEinheit } from "@/lib/curriculum";
import { starteAktivitaet, type AktivitaetAntwort } from "@/lib/aktivitaeten";
import { appStorage } from "@/lib/lernSpeicher";

export interface KursStand {
  version: number; phase: number; textIndex: number; notiz: string; verglichen: boolean;
  selbstbewertung?: Bewertung; kontrolleIndex: number; ergebnisse: { id: string; bewertung: Bewertung }[];
  aktivitaet: AktivitaetAntwort; aktivitaetGeprueft: boolean; abgeschlossen: boolean; hilfen: string[];
}
export const kursStandKey = (e: LernEinheit) => `lernwerkstatt-einheit-${e.id}-v${e.version}`;
export function neuerKursStand(e: LernEinheit): KursStand {
  return { version: e.version, phase: 0, textIndex: 0, notiz: "", verglichen: false, kontrolleIndex: 0,
    ergebnisse: [], aktivitaet: e.aktivitaet ? starteAktivitaet(e.aktivitaet) : { zuordnung: {}, reihenfolge: [], auswahl: [] },
    aktivitaetGeprueft: false, abgeschlossen: false, hilfen: [] };
}
export function ladeKursStand(e: LernEinheit): KursStand {
  try {
    const s = JSON.parse(appStorage.getItem(kursStandKey(e)) || "null");
    if (!s || s.version !== e.version || !Number.isInteger(s.phase) || s.phase < 0 || s.phase > 4 ||
      !Number.isInteger(s.textIndex) || s.textIndex < 0 || s.textIndex >= e.textschritte.length ||
      typeof s.notiz !== "string" || typeof s.verglichen !== "boolean" || typeof s.abgeschlossen !== "boolean" ||
      !Number.isInteger(s.kontrolleIndex) || s.kontrolleIndex < 0 || s.kontrolleIndex >= Math.max(1, e.aufgabenIds.length) ||
      !Array.isArray(s.ergebnisse) || !s.ergebnisse.every((r: { id?: unknown; bewertung?: unknown }) => r && e.aufgabenIds.includes(String(r.id)) && ["richtig", "teilweise", "falsch"].includes(String(r.bewertung))) ||
      new Set(s.ergebnisse.map((r: { id: string }) => r.id)).size !== s.ergebnisse.length ||
      typeof s.aktivitaetGeprueft !== "boolean" || !s.aktivitaet || !s.aktivitaet.zuordnung || typeof s.aktivitaet.zuordnung !== "object" ||
      !Object.values(s.aktivitaet.zuordnung).every((v) => typeof v === "string") ||
      ![s.aktivitaet.reihenfolge, s.aktivitaet.auswahl, s.hilfen].every((v) => Array.isArray(v) && v.every((t: unknown) => typeof t === "string"))) return neuerKursStand(e);
    if (e.aktivitaet?.typ === "reihenfolge" && (s.aktivitaet.reihenfolge.length !== e.aktivitaet.schritte.length || new Set(s.aktivitaet.reihenfolge).size !== e.aktivitaet.schritte.length || !e.aktivitaet.schritte.every((p) => s.aktivitaet.reihenfolge.includes(p.id)))) return neuerKursStand(e);
    return s;
  } catch { return neuerKursStand(e); }
}
