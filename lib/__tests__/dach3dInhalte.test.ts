import { describe, expect, it } from "vitest";
import { DACH_DETAILS, DACH_MODELLE, dachDetailsFuer, getDachDetail, getDachModell } from "@/lib/dach3dInhalte";
import { getLernfeld } from "@/lib/lernfelder";
import { getWerkstattEinheit } from "@/lib/werkstattInhalte";
import { DACH_WIEDERHOLUNGEN, dachWiederholungRoute, istDachBildRef } from "@/lib/dach3dAufgaben";
import type { DachForm } from "@/lib/dach3dTypen";

const serie = (prefix: string, anzahl: number) => Array.from({ length: anzahl }, (_, i) => `${prefix}${String(i + 1).padStart(2, "0")}`);
const erwarteteIds = [...serie("g", 6), ...serie("s", 11), ...serie("w", 4), ...serie("f", 9), ...serie("a", 4)];
const aufgaben = DACH_DETAILS.flatMap(d => d.aufgaben);

describe("Dach erkunden: vollständiger Lernumfang 0.13", () => {
  it("enthält alle 34 vereinbarten Details und 68 stabile Kontrollaufgaben", () => {
    expect(DACH_DETAILS.map(d => d.id)).toEqual(erwarteteIds);
    expect(new Set(DACH_DETAILS.map(d => d.id)).size).toBe(34);
    expect(aufgaben).toHaveLength(68);
    expect(new Set(aufgaben.map(a => a.id)).size).toBe(68);
    expect(new Set(DACH_DETAILS.map(d => d.gruppe))).toEqual(new Set(["aufbau", "dachraender", "oeffnungen", "entwaesserung", "ausstattung"]));
  });

  it("ordnet Dachgeometrien richtig zu und verlangt 104 tatsächliche Detail-Varianten", () => {
    expect(DACH_MODELLE.map(m => m.id)).toEqual(["steildach", "walmdach", "flachdach"]);
    expect(DACH_MODELLE.map(m => m.deckungen.length)).toEqual([2, 2, 1]);
    expect(dachDetailsFuer("steildach")).toHaveLength(21);
    expect(dachDetailsFuer("walmdach")).toHaveLength(22);
    expect(dachDetailsFuer("flachdach")).toHaveLength(18);
    expect(DACH_MODELLE.reduce((n, m) => n + m.detailIds.length * m.deckungen.length, 0)).toBe(104);
    expect(dachDetailsFuer("walmdach").map(d => d.id)).not.toContain("s04"); // Hauptdach ohne Giebelortgang.
    expect(dachDetailsFuer("walmdach").map(d => d.id)).not.toContain("s10"); // Keine erfundene Walmgaube.
    expect(dachDetailsFuer("walmdach").map(d => d.id)).not.toContain("s06"); // Kehle gehört zur Satteldachgaube.
    expect(dachDetailsFuer("steildach").map(d => d.id)).toEqual(expect.arrayContaining(["s04", "s06", "s10"]));
    expect(dachDetailsFuer("flachdach").map(d => d.id)).toEqual(expect.arrayContaining(serie("f", 9)));
    expect(getDachDetail("a02")?.formen).toEqual(["steildach", "walmdach"]);
    for (const m of DACH_MODELLE) {
      expect(getDachModell(m.id)).toBe(m);
      expect(m.detailIds).toEqual(dachDetailsFuer(m.id).map(d => d.id));
      expect(m.systemkarte.angaben.length).toBeGreaterThanOrEqual(3);
      expect(m.systemkarte.grenzen.length).toBeGreaterThanOrEqual(2);
      expect(m.deckungen).toEqual(m.id === "flachdach" ? ["warmdach"] : ["falzziegel", "biber-doppel"]);
    }
  });

  it.each(DACH_DETAILS)("$id besitzt einen konkreten fünfteiligen Lernablauf und erreichbare Verknüpfungen", detail => {
    expect(getDachDetail(detail.id)).toBe(detail);
    expect(detail.version).toBe(1);
    expect(detail.lernzielIds).toEqual([`dach3d-${detail.id}`]);
    expect(detail.funktion.length).toBeGreaterThan(100);
    expect(detail.aufbau.length).toBeGreaterThanOrEqual(3);
    expect(detail.bauteile.length).toBeGreaterThanOrEqual(3);
    expect(new Set(detail.bauteile.map(b => b.id)).size).toBe(detail.bauteile.length);
    expect(detail.schritte.length).toBeGreaterThanOrEqual(4);
    expect(detail.schritte.length).toBeLessThanOrEqual(6);
    for (const schritt of detail.schritte) {
      expect(schritt.id.startsWith(`${detail.id}-schritt-`)).toBe(true);
      expect(schritt.handlung.length).toBeGreaterThan(40);
      expect(schritt.warum.length).toBeGreaterThan(35);
      expect(schritt.kontrolle.length).toBeGreaterThan(25);
      expect(["nah", "schnitt", "aufbau"]).toContain(schritt.ansicht);
    }
    expect(detail.kontrolle.richtig.length).toBeGreaterThan(50);
    expect(detail.kontrolle.fehler.length).toBeGreaterThan(50);
    expect(detail.kontrolle.korrektur.length).toBeGreaterThan(60);
    expect(detail.kontrolle.kriterien.length).toBeGreaterThanOrEqual(3);
    expect(detail.kontrolle.richtig).not.toBe(detail.kontrolle.fehler);
    expect(detail.quellen.join(" ")).toContain("Inhaltsversion 1");
    expect(detail.quellen.join(" ")).toContain("Arbeitsanweisung");
    for (const lfId of detail.lfIds) expect(getLernfeld(lfId), `${detail.id}: ${lfId}`).toBeDefined();
    for (const id of detail.werkstattIds) expect(getWerkstattEinheit(id), `${detail.id}: ${id}`).toBeDefined();
  });

  it.each(DACH_DETAILS)("$id verbindet Funktionsfrage und konkrete Fehlerentscheidung mit festen Bildansichten", d => {
    expect(d.aufgaben.map(a => a.id)).toEqual([`dach3d-${d.id}-funktion`, `dach3d-${d.id}-anwendung`]);
    expect(d.aufgaben[1].frage).toContain(d.kontrolle.fehler);
    expect(d.aufgaben[1].erklaerung).toContain(d.kontrolle.korrektur);
    for (const a of d.aufgaben) {
      expect(a.detailId).toBe(d.id);
      expect(a.lernzielIds).toEqual(d.lernzielIds);
      expect(a.optionen).toHaveLength(4);
      expect(new Set(a.optionen.map(o => o.id)).size).toBe(4);
      expect(new Set(a.optionen.map(o => o.text)).size).toBe(4);
      expect(a.optionen.filter(o => o.korrekt)).toHaveLength(1);
      expect(a.optionen.every(o => o.text.length > 30)).toBe(true);
      const wiederholung = DACH_WIEDERHOLUNGEN.find(w => w.id === a.id)!;
      expect(wiederholung).toBeDefined();
      expect(wiederholung.medienRef?.ansicht).toBe(a.ansicht);
      expect(istDachBildRef(wiederholung.medienRef)).toBe(true);
      expect(wiederholung.lernzielIds).toEqual(d.lernzielIds);
      expect(dachWiederholungRoute(a.id)).toBe(`/projekte#dach-${d.formen[0]}-${d.id}`);
    }
  });

  it("verteilt die korrekten Antworten und bietet keine fachfremden Farb-Ablenkungen an", () => {
    const stellen = new Set(aufgaben.map(a => a.optionen.findIndex(o => o.korrekt)));
    expect(stellen).toEqual(new Set([0, 1, 2, 3]));
    for (const a of aufgaben) {
      expect(a.optionen.map(o => o.text).join(" ")).not.toMatch(/anders färben|Farblinie|Dachfarbfeld|Ziegelfarbe|Holzfarbe|Bahnfarbe|Leitungsfarbe|Farbbeschriftung|stärker glänzend/i);
    }
  });

  it("begrenzt Renderverweise auf passende eigene Dachdetails und bekannte Ansichten", () => {
    const g = { version: 1, form: "walmdach", deckung: "biber-doppel", detailId: "w01", ansicht: "nah" };
    expect(istDachBildRef(g)).toBe(true);
    for (const aenderung of [
      { form: "flachdach" }, { deckung: "warmdach" }, { detailId: "s04" }, { detailId: "../../privat" },
      { ansicht: "fehler" }, { ansicht: "javascript:alert(1)" }, { version: 3 },
    ]) expect(istDachBildRef({ ...g, ...aenderung })).toBe(false);
    for (const form of ["steildach", "walmdach", "flachdach"] satisfies DachForm[]) {
      for (const d of dachDetailsFuer(form)) {
        for (const deckung of getDachModell(form).deckungen) {
          for (const version of [1, 2]) expect(istDachBildRef({ version, form, deckung, detailId: d.id, ansicht: "schnitt" })).toBe(true);
        }
      }
    }
    expect(getDachDetail("unbekannt")).toBeUndefined();
    expect(dachWiederholungRoute("unbekannt")).toBeUndefined();
  });
});
