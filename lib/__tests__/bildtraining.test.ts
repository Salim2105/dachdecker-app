import { beforeEach, describe, expect, it } from "vitest";
import { BILD_AUFGABEN, BILD_THEMEN, bildStandKey, ladeBildStand, leseBildStand, neuerBildStand, pruefeBildAufgabe } from "@/lib/bildtraining";
import { appStorage } from "@/lib/lernSpeicher";
import { starteAktivitaet, type AktivitaetAntwort } from "@/lib/aktivitaeten";

beforeEach(() => appStorage.clear());
describe("24 eigene visuelle Lernaufgaben", () => {
  it("bietet vier verständlich beschriebene Aufgaben je Projekt ohne externe Bildabhängigkeiten", () => {
    expect(BILD_AUFGABEN).toHaveLength(24);
    expect(new Set(BILD_AUFGABEN.map(a => a.id)).size).toBe(24);
    for (const thema of BILD_THEMEN) {
      const aufgaben = BILD_AUFGABEN.filter(a => a.projektId === thema.id);
      expect(aufgaben.map(a => a.art)).toEqual(["bauteile", "folge", "fehler", "massnahme"]);
      for (const a of aufgaben) {
        expect(a.version).toBeGreaterThan(0);
        expect(a.lernzielIds.length).toBeGreaterThan(0);
        expect(a.bildbeschreibung.length).toBeGreaterThan(50);
        expect(a.svg).toContain("<svg");
        expect(a.svg).not.toMatch(/<script|<image|href=|onload=/i);
        expect(a.aktivitaet.erklaerung.length).toBeGreaterThan(50);
      }
    }
  });
  it("bewertet jede Aufgabenform und belohnt wahlloses Ankreuzen nicht als richtige Lösung", () => {
    for (const a of BILD_AUFGABEN) {
      const akt = a.aktivitaet;
      const richtig: AktivitaetAntwort = { zuordnung: {}, reihenfolge: [], auswahl: [] };
      if (akt.typ === "zuordnen") {
        richtig.zuordnung = Object.fromEntries(akt.paare.map(p => [p.id, p.id]));
        expect(a.bildbereiche.map(b => b.id)).toEqual(akt.paare.map(p => p.id));
        expect(pruefeBildAufgabe(a, starteAktivitaet(akt))).toBe("falsch");
      } else if (akt.typ === "reihenfolge") {
        richtig.reihenfolge = akt.schritte.map(s => s.id);
        expect(pruefeBildAufgabe(a, starteAktivitaet(akt))).not.toBe("richtig");
      } else {
        richtig.auswahl = akt.optionen.filter(o => o.korrekt).map(o => o.id);
        expect(pruefeBildAufgabe(a, { ...richtig, auswahl: akt.optionen.map(o => o.id) })).not.toBe("richtig");
      }
      expect(pruefeBildAufgabe(a, richtig)).toBe("richtig");
    }
  });
  it("stellt Antwortreihenfolge, Hilfen, Notiz und dieselbe Versuch-ID wieder her", () => {
    const a = BILD_AUFGABEN.find(a => a.art === "folge")!;
    const stand = { ...neuerBildStand(a), notiz: "Erst prüfen, dann ausführen.", hilfen: ["bildhinweis"] };
    stand.antwort.reihenfolge.reverse();
    appStorage.setItem(bildStandKey(a.id), JSON.stringify(stand));
    expect(ladeBildStand(a)).toEqual(stand);
    const fertig = { ...stand, geprueft: true, bewertetAm: 1234, abgeschlossen: true };
    appStorage.setItem(bildStandKey(a.id), JSON.stringify(fertig));
    expect(ladeBildStand(a)).toEqual(fertig);
  });
  it("erkennt beschädigte und fremde Antwort-IDs, ohne das Original zu überschreiben", () => {
    const a = BILD_AUFGABEN[0];
    const raw = JSON.stringify({ ...neuerBildStand(a), antwort: { zuordnung: { p1: "unbekannt" }, reihenfolge: [], auswahl: [] } });
    appStorage.setItem(bildStandKey(a.id), raw);
    expect(leseBildStand(raw, a)).toBeNull();
    ladeBildStand(a);
    expect(appStorage.getItem(bildStandKey(a.id))).toBe(raw);
    expect(leseBildStand("null", a)).toBeNull();
    expect(leseBildStand(JSON.stringify({ ...neuerBildStand(a), bewertetAm: 1234 }), a)).toBeNull();
  });
});
