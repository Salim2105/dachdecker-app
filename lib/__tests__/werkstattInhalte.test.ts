import { describe, expect, it } from "vitest";
import { WERKSTATT_PFADE, WERKSTATT_SYSTEMKARTEN, getWerkstattEinheit, getWerkstattPfad } from "@/lib/werkstattInhalte";
import { validWerkstattEinheit, bewerteWerkstattAufgabe, emptyWerkstattAntwort } from "@/lib/werkstattStand";
import type { WerkstattAufgabe } from "@/lib/werkstattTypen";

const einheiten = WERKSTATT_PFADE.flatMap(p => p.einheiten);
const slugs = ["messen", "ziegel", "laengen", "breiten", "wasser", "verlegen", "schnitt", "bearbeiten", "befestigen", "kontrolle"];

describe("Werkstattinhalt 0.12", () => {
  it("liefert zwei vollständige Wege mit 20 Einheiten und 40 unterscheidbaren Übungen", () => {
    expect(WERKSTATT_PFADE.map(p => p.id)).toEqual(["falzziegel", "biber-doppel"]);
    expect(einheiten).toHaveLength(20);
    const aufgaben = einheiten.flatMap(e => e.aufgaben);
    expect(aufgaben).toHaveLength(40);
    expect(new Set(einheiten.map(e => e.id)).size).toBe(20);
    expect(new Set(aufgaben.map(a => a.id)).size).toBe(40);
    expect(new Set(einheiten.map(e => e.wiederholungId)).size).toBe(20);
    for (const p of WERKSTATT_PFADE) {
      expect(p.einheiten.map(e => e.slug)).toEqual(slugs);
      expect(p.einheiten.map(e => e.nummer)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(new Set(p.einheiten.flatMap(e => e.aufgaben.map(a => a.typ)))).toEqual(new Set(["anzeichnen", "aktivitaet", "einteilen", "verlegen"]));
    }
  });

  it.each(einheiten)("$id hat einen sicher speicherbaren, vollständigen Lern- und Praxisablauf", e => {
    expect(validWerkstattEinheit(e)).toBe(true);
    expect(e.lernziel.startsWith("Du ")).toBe(true);
    expect(e.minuten).toBeGreaterThanOrEqual(5);
    expect(e.minuten).toBeLessThanOrEqual(10);
    expect(e.bildschritte.length).toBeGreaterThanOrEqual(4);
    expect(e.bildschritte.length).toBeLessThanOrEqual(6);
    for (const s of e.bildschritte) {
      expect(s.handlung.length).toBeGreaterThan(40);
      expect(s.warum.length).toBeGreaterThan(35);
      expect(s.kontrolle.trim()).not.toBe("");
    }
    expect(e.praxis.werkzeuge.length).toBeGreaterThanOrEqual(3);
    expect(e.praxis.material.length).toBeGreaterThanOrEqual(3);
    expect(e.praxis.ablauf.length).toBeGreaterThanOrEqual(4);
    expect(e.praxis.kontrolle.length).toBeGreaterThanOrEqual(4);
    expect(e.praxis.gespraech).toHaveLength(4);
    expect(e.praxis.sicherheit.length).toBeGreaterThanOrEqual(2);
    expect(getWerkstattEinheit(e.id)).toBe(e);
    expect(e.systemkarte).toBe(getWerkstattPfad(e.pfadId)?.systemkarte);
  });

  it("rechnet die Fallgeometrie aus den Vorgaben unabhängig nach", () => {
    const f = WERKSTATT_SYSTEMKARTEN.falzziegel.masse;
    const b = WERKSTATT_SYSTEMKARTEN["biber-doppel"].masse;
    // A possible number of intervals must fit both upper and lower permitted distances.
    const falzMinAnzahl = Math.ceil(f.feldLaenge / f.maxDeckLaenge);
    const falzMaxAnzahl = Math.floor(f.feldLaenge / f.minDeckLaenge);
    expect(falzMinAnzahl).toBe(6);
    expect(falzMaxAnzahl).toBe(6);
    expect(f.feldLaenge / falzMinAnzahl).toBe(34);
    expect(f.feldBreite / f.deckBreite).toBe(5);
    expect(f.ziegelLaenge - f.deckLaenge).toBe(8);

    const biberLattung = (b.ziegelLaenge - b.kopfUeberdeckung) / 2;
    const benachbarteUeberlappung = b.ziegelLaenge - biberLattung;
    expect(biberLattung).toBe(15);
    expect(benachbarteUeberlappung).toBe(23);
    expect(benachbarteUeberlappung).not.toBe(b.kopfUeberdeckung);
    expect(b.feldLaenge / biberLattung).toBe(6);
    expect(b.ziegelBreite + 0.2).toBeCloseTo(b.deckBreite, 12);
    expect(b.feldBreite / b.deckBreite).toBe(5);
    // 90 cm are module-to-module references, not five outer tile widths plus four joints.
    expect(5 * b.ziegelBreite + 4 * 0.2).toBeCloseTo(89.8, 12);
  });

  it("enthält für jedes Raster genau eine zum Übungsbereich passende ganze Einteilung", () => {
    const raster = einheiten.flatMap(e => e.aufgaben).filter(a => a.typ === "einteilen");
    expect(raster).toHaveLength(4);
    for (const a of raster) {
      const passend = Array.from({ length: 100 }, (_, i) => i + 1).filter(n => {
        const abstand = (a.strecke - a.zielVersatz) / n;
        return abstand >= a.minAbstand - 1e-8 && abstand <= a.maxAbstand + 1e-8;
      });
      expect(passend, a.id).toEqual([a.zielAnzahl]);
      const antwort = emptyWerkstattAntwort(a);
      antwort.anzahl = String(passend[0]);
      antwort.versatz = String(a.zielVersatz);
      expect(bewerteWerkstattAufgabe(a, antwort).richtig, a.id).toBe(true);
      antwort.anzahl = String(passend[0] + 1);
      expect(bewerteWerkstattAufgabe(a, antwort).richtig, a.id).toBe(false);
    }
  });

  it("verknüpft alle Anrisse und Verlegeplätze mit real vorhandenen Zielpunkten", () => {
    for (const a of einheiten.flatMap(e => e.aufgaben)) {
      if (a.typ === "anzeichnen") {
        const punkte = a.loesung.map(id => a.punkte.find(p => p.id === id)!);
        expect(punkte.every(Boolean)).toBe(true);
        expect(punkte[0].x === punkte[1].x || punkte[0].y === punkte[1].y).toBe(true);
        if (a.modus === "schnitt") {
          expect(punkte[0].x).toBe(390);
          expect(punkte[1].x).toBe(390);
          expect(a.nutzseite).toBe("links");
        }
      }
      if (a.typ === "verlegen") {
        expect(new Set(a.teile.map(t => t.zielId)).size).toBe(a.teile.length);
        expect(a.teile.every(t => a.ziele.some(z => z.id === t.zielId))).toBe(true);
      }
    }
  });

  it("stellt den Biberverband in den oberen Zielplätzen um ein halbes Modul versetzt dar", () => {
    const falz = getWerkstattEinheit("werkstatt-falzziegel-verlegen")!.aufgaben[0];
    const biber = getWerkstattEinheit("werkstatt-biber-doppel-verlegen")!.aufgaben[0];
    expect(falz.typ).toBe("verlegen");
    expect(biber.typ).toBe("verlegen");
    if (falz.typ !== "verlegen" || biber.typ !== "verlegen") throw new Error("Verlegeaufgaben fehlen");
    expect(falz.ziele[2].x).toBe(falz.ziele[0].x);
    const modul = biber.ziele[1].x - biber.ziele[0].x;
    expect(biber.ziele[2].x - biber.ziele[0].x).toBe(modul / 2);
    expect(biber.ziele[3].x - biber.ziele[1].x).toBe(modul / 2);
  });

  it("trennt den Kronenvergleich vom vollständigen Doppeldeckungspfad", () => {
    const vergleich = getWerkstattEinheit("werkstatt-biber-doppel-ziegel")!;
    expect(vergleich.bildschritte.some(s => s.szene === "kronenvergleich")).toBe(true);
    expect(vergleich.bildschritte.map(s => s.handlung).join(" ")).toMatch(/Kronendeckung.*zwei Reihen auf einer Latte/);
    expect(WERKSTATT_PFADE.some(p => String(p.id).includes("krone"))).toBe(false);
  });

  it("hält Anleitungen und echte Ausführung produktbezogen und rendert kein Inhalts-Rohmarkup", () => {
    for (const p of WERKSTATT_PFADE) {
      expect(p.systemkarte.hinweis).toMatch(/Schulmodell/);
      expect(p.systemkarte.hinweis).toMatch(/keine allgemeinen Ausführungsregeln/);
      expect(p.systemkarte.angaben.join(" ")).not.toMatch(/sechs Abstände|fünf Deckbreiten/);
      for (const a of p.einheiten.flatMap(e => e.aufgaben)) {
        if (a.typ === "aktivitaet") expect("svg" in a.aktivitaet).toBe(false);
      }
    }
    expect(getWerkstattPfad("unbekannt")).toBeUndefined();
    expect(getWerkstattEinheit("/fremd")).toBeUndefined();
  });

  it("hat für jede automatisch prüfbare Übung eine erreichbare, voll bewertete Lösung", () => {
    function loese(a: WerkstattAufgabe) {
      const r = emptyWerkstattAntwort(a);
      if (a.typ === "anzeichnen") { r.punkte = [...a.loesung]; r.nutzseite = a.nutzseite ?? ""; }
      else if (a.typ === "einteilen") { r.anzahl = String(a.zielAnzahl); r.versatz = String(a.zielVersatz); }
      else if (a.typ === "verlegen") { r.belegung = Object.fromEntries(a.teile.map(t => [t.id, t.zielId])); r.folge = a.teile.map(t => t.id); }
      else if (a.aktivitaet.typ === "zuordnen") r.aktivitaet.zuordnung = Object.fromEntries(a.aktivitaet.paare.map(p => [p.id, p.id]));
      else if (a.aktivitaet.typ === "reihenfolge") r.aktivitaet.reihenfolge = a.aktivitaet.schritte.map(s => s.id);
      else r.aktivitaet.auswahl = a.aktivitaet.optionen.filter(o => o.korrekt).map(o => o.id);
      return r;
    }
    for (const e of einheiten) for (const a of e.aufgaben) {
      const ergebnis = bewerteWerkstattAufgabe(a, loese(a));
      expect(ergebnis.richtig, a.id).toBe(true);
      expect(ergebnis.erreicht, a.id).toBe(ergebnis.moeglich);
    }
  });
});
