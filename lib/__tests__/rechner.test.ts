import { describe, expect, it } from "vitest";
import {
  wahreDachflaeche,
  sparrenlaenge,
  firsthoehe,
  neigungAusMassen,
  gradZuProzent,
  prozentZuGrad,
  waermedurchlasswiderstand,
  uWert,
  regenwasserabfluss,
  laengenausdehnung,
  materialbedarf,
  zahl,
  RSE,
} from "@/lib/rechner";

describe("Dachgeometrie", () => {
  it("bei 0° ist die wahre Fläche gleich der Grundfläche", () => {
    expect(wahreDachflaeche(100, 0)).toBeCloseTo(100, 6);
  });

  it("bei 45° ist die wahre Fläche um den Faktor Wurzel 2 größer", () => {
    expect(wahreDachflaeche(100, 45)).toBeCloseTo(100 * Math.SQRT2, 6);
  });

  it("bei 30° und 4 m halber Breite stimmen Sparrenlänge und Höhe", () => {
    expect(sparrenlaenge(4, 30)).toBeCloseTo(4.6188, 3);
    expect(firsthoehe(4, 30)).toBeCloseTo(2.3094, 3);
  });

  it("Sparren, halbe Breite und Höhe erfüllen den Satz des Pythagoras", () => {
    const b = 5.2;
    const grad = 38;
    const l = sparrenlaenge(b, grad);
    const h = firsthoehe(b, grad);
    expect(b * b + h * h).toBeCloseTo(l * l, 6);
  });

  it("rechnet aus Höhe und Breite die Neigung zurück", () => {
    expect(neigungAusMassen(2.3094, 4)).toBeCloseTo(30, 3);
    expect(neigungAusMassen(5, 5)).toBeCloseTo(45, 6);
  });

  it("100 Prozent Neigung sind 45 Grad", () => {
    expect(gradZuProzent(45)).toBeCloseTo(100, 6);
    expect(prozentZuGrad(100)).toBeCloseTo(45, 6);
  });

  it("begrenzt die Neigung, statt durch null zu teilen", () => {
    expect(Number.isFinite(wahreDachflaeche(100, 90))).toBe(true);
    expect(Number.isFinite(wahreDachflaeche(100, 180))).toBe(true);
  });
});

describe("Bauphysik", () => {
  it("R ergibt sich aus Dicke durch Lambda", () => {
    // 20 cm mit lambda 0,040 → 0,20 / 0,040 = 5,0
    const r = waermedurchlasswiderstand([{ name: "Dämmung", dickeCm: 20, lambda: 0.04 }]);
    expect(r).toBeCloseTo(5, 6);
  });

  it("addiert mehrere Schichten", () => {
    const r = waermedurchlasswiderstand([
      { name: "Dämmung", dickeCm: 20, lambda: 0.04 },
      { name: "Holz", dickeCm: 2.4, lambda: 0.13 },
    ]);
    expect(r).toBeCloseTo(5 + 0.024 / 0.13, 6);
  });

  it("ignoriert Schichten ohne Dicke oder Lambda", () => {
    const r = waermedurchlasswiderstand([
      { name: "leer", dickeCm: 0, lambda: 0.04 },
      { name: "kaputt", dickeCm: 10, lambda: 0 },
    ]);
    expect(r).toBe(0);
  });

  it("U ist der Kehrwert des Gesamtwiderstands", () => {
    expect(uWert(5, 0.1, RSE)).toBeCloseTo(1 / 5.14, 6);
  });

  it("liefert bei leerem Aufbau kein Unendlich", () => {
    expect(uWert(0, 0, 0)).toBe(0);
  });
});

describe("Entwässerung und Metall", () => {
  it("berechnet den Regenwasserabfluss", () => {
    // 300 l/(s·ha), 200 m², C = 1 → 300 · 200 · 1 / 10000 = 6 l/s
    expect(regenwasserabfluss(300, 200, 1)).toBeCloseTo(6, 6);
  });

  it("berücksichtigt den Abflussbeiwert", () => {
    expect(regenwasserabfluss(300, 200, 0.5)).toBeCloseTo(3, 6);
  });

  it("berechnet die Längenänderung in Millimetern", () => {
    // Titanzink, 10 m, 50 K → 22e-6 · 10 · 50 · 1000 = 11 mm
    expect(laengenausdehnung(22, 10, 50)).toBeCloseTo(11, 6);
  });
});

describe("Materialbedarf", () => {
  it("rundet auf ganze Stück auf", () => {
    expect(materialbedarf(100, 12.5, 0)).toBe(1250);
    expect(materialbedarf(10, 12.3, 0)).toBe(123);
    expect(materialbedarf(10, 12.34, 0)).toBe(124);
  });

  it("schlägt den Verschnitt auf", () => {
    expect(materialbedarf(100, 10, 5)).toBe(1050);
  });
});

describe("zahl", () => {
  it("formatiert mit Komma", () => {
    expect(zahl(1.5)).toBe("1,50");
    expect(zahl(1.234, 1)).toBe("1,2");
  });

  it("fängt ungültige Werte ab", () => {
    expect(zahl(NaN)).toBe("—");
    expect(zahl(Infinity)).toBe("—");
  });
});
