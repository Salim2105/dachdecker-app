import { describe, expect, it } from "vitest";
import { schaetzeSekunden, zeitAuswahl } from "@/lib/lernzeit";
import { PRAXISFAELLE, pruefePraxisZahl } from "@/lib/praxis";
import { ziehePruefung } from "@/lib/pruefung";
import type { Aufgabe } from "@/content/schema";

const mc = (id: string, lf = "lf01"): Aufgabe => ({ id, lernfeld: lf, typ: "mc", thema: "Test", quelle: "Test", konfidenz: "hoch", erklaerung: "Test", frage: "?", optionen: ["A"], korrekt: [0] });
const calc: Aufgabe = { ...mc("calc"), typ: "calc", aufgabentext: "Rechnen", parameter: [], toleranzProzent: 1, schritte: [
  { beschreibung: "Schritt 1", formel: "2", ergebnisName: "a", einheit: "m" },
  { beschreibung: "Schritt 2", formel: "a*2", ergebnisName: "b", einheit: "m" },
] };

describe("Zeitplanung", () => {
  it("plant für verkettete Rechnungen mehr Zeit und hält Nacharbeitszeit frei", () => {
    expect(schaetzeSekunden(calc)).toBeGreaterThan(schaetzeSekunden(mc("a")));
    const auswahl = zeitAuswahl([calc, mc("a"), mc("b"), mc("c")], 5);
    expect(auswahl.reduce((s, a) => s + schaetzeSekunden(a), 0)).toBeLessThanOrEqual(240);
    expect(auswahl).toHaveLength(1);
    expect(auswahl[0].id).toBe("calc");
  });
  it("erlaubt längere Runden, ohne Aufgaben zu duplizieren", () => {
    const pool = Array.from({ length: 30 }, (_, i) => mc(String(i)));
    const kurz = zeitAuswahl(pool, 5);
    const lang = zeitAuswahl(pool, 30);
    expect(lang.length).toBeGreaterThan(kurz.length);
    expect(new Set(lang.map((a) => a.id)).size).toBe(lang.length);
    expect(zeitAuswahl([], 5)).toEqual([]);
  });
});

describe("Trainingsmix", () => {
  it("lässt kleine Lernfelder neben einem großen Feld zu Wort kommen", () => {
    const pool = [...Array.from({ length: 20 }, (_, i) => mc(`gross-${i}`)), mc("klein-1", "lf02"), mc("klein-2", "lf03")];
    const gezogen = ziehePruefung(pool, 3, () => 0.5);
    expect(new Set(gezogen.map((a) => a.lernfeld)).size).toBe(3);
    expect(new Set(ziehePruefung(pool, 99).map((a) => a.id)).size).toBe(pool.length);
  });
  it("mischt auch unterschiedliche Aufgabentypen innerhalb eines Feldes", () => {
    const pool = [...Array.from({ length: 10 }, (_, i) => mc(String(i))), calc];
    const gezogen = ziehePruefung(pool, 2, () => 0.5);
    expect(new Set(gezogen.map((a) => a.typ))).toEqual(new Set(["mc", "calc"]));
  });
});

describe("Praxisrechnungen", () => {
  it("prüft die zusammenhängende Mengenrechnung inklusive Zuschlag und Aufrunden", () => {
    const sattel = PRAXISFAELLE.find((f) => f.id === "satteldach")!;
    const platten = PRAXISFAELLE.find((f) => f.id === "platten")!;
    expect(sattel.rechnungen.map((r) => r.ergebnis)).toEqual([2 * 10 * 6, 120 * 10, 1200 * 1.08]);
    expect(platten.rechnungen[2].ergebnis).toBe(Math.ceil((8 * 5 * 1.1) / (1.2 * 0.6)));
    expect(pruefePraxisZahl("61", platten.rechnungen[2].ergebnis)).toBe(false);
    expect(pruefePraxisZahl("62", platten.rechnungen[2].ergebnis)).toBe(true);
  });
  it("akzeptiert ein Dezimalkomma und lehnt leere oder ungültige Werte ab", () => {
    expect(pruefePraxisZahl("0,72", 0.72)).toBe(true);
    for (const v of ["", "abc", "Infinity", "62 Platten"]) expect(pruefePraxisZahl(v, 62)).toBe(false);
  });
});
