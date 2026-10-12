import { beforeEach, describe, expect, it } from "vitest";
import { PRAXISFAELLE } from "@/lib/praxis";
import { lesePraxis, leererPraxisStand, praxisStore, speicherePraxis } from "@/lib/praxisStore";
import { erklaereLernplan } from "@/lib/lernplan";
import { exportiereDaten, importiereDaten } from "@/lib/backup";
import type { Aufgabe, AufgabenFortschritt } from "@/content/schema";

beforeEach(() => { localStorage.clear(); praxisStore.set(""); });

describe("Neue Praxisfälle", () => {
  it("prüft Gefälle, schräge Dachfläche, Überdeckungen und Wassermenge unabhängig", () => {
    const ergebnisse = (id: string) => PRAXISFAELLE.find((f) => f.id === id)!.rechnungen.map((r) => r.ergebnis);
    expect(ergebnisse("gefaelle")).toEqual([6 * 100 * 0.02, 100 * 0.02]);
    expect(ergebnisse("dachschraege")).toEqual([8 / 2, Math.hypot(4, 3), 2 * 10 * Math.hypot(4, 3)]);
    const n = ergebnisse("bahnen")[1];
    expect(1 + (n - 1) * 0.9).toBeGreaterThanOrEqual(5.4);
    expect(1 + (n - 2) * 0.9).toBeLessThan(5.4);
    expect(ergebnisse("bahnen")[2]).toBe(n * 8);
    expect(ergebnisse("regen")).toEqual([15, 120 * 15, 120 * 15 / (30 * 60)]);
  });
});

describe("Praxis speichern und sichern", () => {
  it("bewahrt Entwürfe, Hilfen und Selbsteinschätzung pro Fall und im Backup", () => {
    const fall = PRAXISFAELLE[0];
    const stand = { ...leererPraxisStand(fall), eingaben: ["120", "1200", "1296"], begruendung: "Produkt und Dachneigung prüfen", geprueft: true, mitHilfe: true, selbstBewertung: "teilweise" as const };
    speicherePraxis(fall.id, stand);
    speicherePraxis(PRAXISFAELLE[1].id, leererPraxisStand(PRAXISFAELLE[1]));
    expect(lesePraxis(praxisStore.getSnapshot())[fall.id]).toEqual(stand);
    const backup = exportiereDaten();
    localStorage.clear();
    expect(importiereDaten(backup)).toBe(1);
    expect(lesePraxis(localStorage.getItem("praxis-v1")!)[fall.id]).toEqual(stand);
  });
  it("behandelt beschädigte Daten und eine geänderte Anzahl Rechenschritte sicher", () => {
    for (const text of ["kaputt", "null", "[]", '{"satteldach":{"eingaben":["1"],"begruendung":"a"}}']) expect(lesePraxis(text)).toEqual({});
    const stand = { ...leererPraxisStand(PRAXISFAELLE[0]), geprueft: true, selbstBewertung: "richtig" };
    expect(lesePraxis(JSON.stringify({ satteldach: stand })).satteldach.geprueft).toBe(false);
    expect(lesePraxis(JSON.stringify({ satteldach: stand })).satteldach.selbstBewertung).toBeUndefined();
  });
});

describe("Lernplan begründen", () => {
  it("trennt neue, fällige und gespeicherte Aufgaben sowie gleichnamige Themen unterschiedlicher Lernfelder", () => {
    const aufgaben = [
      { id: "a", lernfeld: "lf01", thema: "Material" }, { id: "b", lernfeld: "lf01", thema: "Material" },
      { id: "c", lernfeld: "lf02", thema: "Material" },
    ] as Aufgabe[];
    const fortschritt: Record<string, AufgabenFortschritt> = {
      b: { aufgabeId: "b", bewertung: "richtig", gesehenAm: 80, intervallTage: 1, faelligAm: 90 },
      c: { aufgabeId: "c", bewertung: "richtig", gesehenAm: 80, intervallTage: 1, faelligAm: 110 },
    };
    expect(erklaereLernplan(aufgaben, fortschritt, 100)).toEqual([
      { lernfeld: "lf01", thema: "Material", neu: 1, faellig: 1, freiwillig: 0 },
      { lernfeld: "lf02", thema: "Material", neu: 0, faellig: 0, freiwillig: 1 },
    ]);
  });
});
