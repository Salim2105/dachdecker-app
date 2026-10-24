import { describe, expect, it } from "vitest";
import {
  gratsparren,
  kehle,
  schleppgaube,
  satteldachgaube,
  haftabstand,
  scharen,
  ziegelProQm,
  wahreDachflaeche,
  sparrenlaenge,
  firsthoehe,
  neigungAusMassen,
  gradZuProzent,
  prozentZuGrad,
  waermedurchlasswiderstand,
  uWert,
  regenwasserabfluss,
  ablaufanzahl,
  laengenausdehnung,
  materialbedarf,
  zahl,
  RSE,
  RechenFehler,
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

  it("weist Neigungen außerhalb des Modells ausdrücklich zurück", () => {
    for (const winkel of [-1, 90, 180, Infinity, NaN]) expect(() => wahreDachflaeche(100, winkel)).toThrow(RechenFehler);
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

  it("weist ungültige Schichten zurück, statt sie wegzulassen", () => {
    for (const schicht of [{ name: "leer", dickeCm: 0, lambda: 0.04 }, { name: "kaputt", dickeCm: 10, lambda: 0 }]) {
      expect(() => waermedurchlasswiderstand([{ name: "gültig", dickeCm: 20, lambda: 0.035 }, schicht])).toThrow(RechenFehler);
    }
    expect(() => waermedurchlasswiderstand([])).toThrow(RechenFehler);
  });

  it("U ist der Kehrwert des Gesamtwiderstands", () => {
    expect(uWert(5, 0.1, RSE)).toBeCloseTo(1 / 5.14, 6);
  });

  it("liefert bei leerem Aufbau kein Unendlich", () => {
    expect(() => uWert(0, 0, 0)).toThrow(RechenFehler);
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

describe("gratsparren", () => {
  // Der Kern der Grat-Geometrie: gleiche Höhe, längerer Weg — also flacher.
  // Wer den Gratsparren mit der Dachneigung ablängt, schneidet zu kurz.
  it("liefert einen längeren und flacheren Sparren als in der Fläche", () => {
    const d = gratsparren(4, 30);
    expect(d.grat).toBeGreaterThan(d.sparren);
    expect(d.gratneigung).toBeLessThan(30);
  });

  it("rechnet das Buchbeispiel nach", () => {
    const d = gratsparren(4, 30);
    expect(d.hoehe).toBeCloseTo(2.309, 2);
    expect(d.sparren).toBeCloseTo(4.619, 2);
    expect(d.grat).toBeCloseTo(6.11, 2);
    expect(d.gratneigung).toBeCloseTo(22.21, 1);
  });

  it("hat bei 45 Grad noch immer einen flacheren Grat", () => {
    expect(gratsparren(5, 45).gratneigung).toBeLessThan(45);
  });
});

describe("kehle", () => {
  it("entspricht der Formel aus den Aufgaben", () => {
    // k = √((f1/2)² + (f2/2)² + h²)
    const k = kehle(8, 6, 2.5);
    expect(k.laenge).toBeCloseTo(Math.sqrt(16 + 9 + 6.25), 4);
  });

  // Grat und Kehle sind dieselbe Raumdiagonale — einmal nach außen, einmal
  // nach innen. Bei gleichen Feldern muss dieselbe Länge herauskommen.
  it("ist bei gleichen Feldern so lang wie der Grat", () => {
    const d = gratsparren(4, 30);
    expect(kehle(8, 8, d.hoehe).laenge).toBeCloseTo(d.grat, 4);
  });

  it("fängt Nullmaße ab", () => {
    expect(() => kehle(0, 0, 0)).toThrow(RechenFehler);
  });
});

describe("schleppgaube", () => {
  // Gegengerechnet mit dem durchgerechneten Beispiel auf Buchseite 540:
  // Hauptdach 40°, Gaube 25°, Sparrenlänge 4,30 m, Überstand 25 cm.
  // Das Buch kommt auf t_g = 3,67 m und h_g = 3,08 m.
  it("trifft das durchgerechnete Buchbeispiel S. 540", () => {
    const g = schleppgaube(4.3, 0.25, 40, 25);
    expect(g.tiefe).toBeCloseTo(3.67, 2);
    expect(g.hoehe).toBeCloseTo(3.08, 2);
  });

  // Nach Buchbeispiel S. 540: s' = s − ü, t = s'·cos β, h = t·tan α
  it("folgt der Schrittkette aus dem Buch", () => {
    const g = schleppgaube(5, 0.5, 40, 15);
    const sStrich = 4.5;
    const tiefe = sStrich * Math.cos((15 * Math.PI) / 180);
    expect(g.tiefe).toBeCloseTo(tiefe, 4);
    expect(g.hoehe).toBeCloseTo(tiefe * Math.tan((40 * Math.PI) / 180), 4);
    expect(g.anschluss).toBeCloseTo(Math.hypot(g.tiefe, g.hoehe), 4);
  });

  // Die Höhe kommt von der HAUPTdachneigung: ein steileres Hauptdach steigt
  // über dieselbe Tiefe weiter an, also wird die Gaube höher.
  it("wird mit steilerem Hauptdach höher", () => {
    expect(schleppgaube(5, 0.5, 50, 15).hoehe).toBeGreaterThan(
      schleppgaube(5, 0.5, 30, 15).hoehe,
    );
  });

  it("weist unmögliche Überstände zurück", () => {
    expect(() => schleppgaube(1, 5, 40, 15)).toThrow(RechenFehler);
    expect(() => schleppgaube(1, 1, 40, 15)).toThrow(RechenFehler);
  });
});

describe("satteldachgaube", () => {
  it("leitet die Dachneigung aus den Wangenmaßen ab", () => {
    const g = satteldachgaube(2, 2, 3, 1.5, 1.4);
    expect(g.neigung).toBeCloseTo(45, 4);
    expect(g.anschluss).toBeCloseTo(Math.sqrt(8), 4);
  });

  // Zwei Trapeze: je Seite (First + Traufe) / 2 · Sparren.
  it("rechnet die Gaubendachfläche als zwei Trapeze", () => {
    const g = satteldachgaube(2, 2, 3, 1.5, 1.4);
    expect(g.dachflaeche).toBeCloseTo(2 * (0.5 * (3 + 1.5) * 1.4), 4);
  });

  it("legt die Kehle über die Differenz von First und Traufe", () => {
    const g = satteldachgaube(2, 2, 3, 1.5, 1.4);
    expect(g.kehle).toBeCloseTo(Math.hypot(3 - 1.5, 1.4), 4);
  });

  it("bleibt bei gleich langem First und Traufe rechtwinklig", () => {
    expect(satteldachgaube(2, 2, 2, 2, 1.4).kehlwinkel).toBe(90);
  });
});

describe("haftabstand und scharen", () => {
  // Buchaufgabe 17 (S. 463): Scharbreite 520 mm.
  it("rechnet den Haftabstand aus Scharbreite und Hafte je m²", () => {
    // 1 / 0,52 = 1,923 lfm Schar je m²; auf 4 Hafte verteilt.
    expect(haftabstand(0.52, 4)).toBeCloseTo(1 / 0.52 / 4, 6);
    expect(haftabstand(0.52, 4)).toBeCloseTo(0.4808, 3);
  });

  // Buchaufgabe 18: im Eckbereich 6,4 Hafte/m², innen 4 — außen enger.
  it("rückt die Hafte im Eckbereich zusammen", () => {
    expect(haftabstand(0.52, 6.4)).toBeLessThan(haftabstand(0.52, 4));
  });

  it("fängt Nullwerte ab", () => {
    expect(() => haftabstand(0, 4)).toThrow(RechenFehler);
    expect(() => haftabstand(0.52, 0)).toThrow(RechenFehler);
  });

  it("teilt die Dachlänge in volle Scharen und Passbreite", () => {
    const s = scharen(12, 0.525);
    expect(s.anzahl).toBe(22);
    expect(s.passbreite).toBeCloseTo((12 - 22 * 0.525) / 2, 6);
    // Die Passbreite verteilt sich auf beide Ortgänge.
    expect(s.anzahl * 0.525 + 2 * s.passbreite).toBeCloseTo(12, 6);
  });

  it("weist unbrauchbare Nutzbreiten zurück", () => {
    expect(() => scharen(12, 0)).toThrow(RechenFehler);
    expect(() => scharen(12, 13)).toThrow(RechenFehler);
  });
});

describe("ziegelProQm", () => {
  it("rechnet aus Deckbreite und Decklänge", () => {
    // 20 cm × 34 cm = 680 cm² je Ziegel → 10000/680 ≈ 14,7 Stück/m²
    expect(ziegelProQm(20, 34)).toBeCloseTo(14.7, 1);
  });

  it("braucht bei kleineren Ziegeln mehr Stück", () => {
    expect(ziegelProQm(15, 25)).toBeGreaterThan(ziegelProQm(20, 34));
  });

  it("fängt Nullmaße ab", () => {
    expect(() => ziegelProQm(0, 34)).toThrow(RechenFehler);
  });
});


describe("Modellgrenzen und Einheiten", () => {
  it.each([
    () => wahreDachflaeche(-100, 30), () => sparrenlaenge(0, 30), () => firsthoehe(4, NaN),
    () => neigungAusMassen(-1, 4), () => neigungAusMassen(1, 0), () => gradZuProzent(90),
    () => prozentZuGrad(-1), () => regenwasserabfluss(300, 200, 1.1), () => regenwasserabfluss(300, 200, -0.1),
    () => regenwasserabfluss(300, 0, 1), () => laengenausdehnung(-22, 10, 50), () => laengenausdehnung(22, 0, 50),
    () => laengenausdehnung(22, 10, Infinity), () => materialbedarf(100, -10, 5), () => materialbedarf(100, 10, -5),
    () => materialbedarf(1e300, 1e300, 5), () => gratsparren(-4, 30), () => kehle(8, -6, 2),
    () => schleppgaube(5, -1, 40, 15), () => schleppgaube(5, 0.5, 15, 15), () => schleppgaube(5, 0.5, 15, 40),
    () => satteldachgaube(1, 1, 1, 3, 1), () => satteldachgaube(1, 0, 3, 1, 1),
    () => haftabstand(NaN, 4), () => scharen(-12, 0.525), () => ziegelProQm(20, Infinity),
    () => waermedurchlasswiderstand([{ name: "defekt", dickeCm: -2, lambda: 0.04 }]),
    () => waermedurchlasswiderstand([{ name: "defekt", dickeCm: 20, lambda: Infinity }]),
    () => uWert(5, -0.1, 0.04),
  ])("liefert für ungültige Eingaben kein scheinbar gültiges Ergebnis (%#)", (rechne) => {
    expect(rechne).toThrow(RechenFehler);
  });

  it("unterscheidet Zentimeter, Meter und Quadratmeter", () => {
    expect(waermedurchlasswiderstand([{ name: "Dämmung", dickeCm: 20, lambda: 0.04 }])).toBe(5);
    expect(ziegelProQm(20, 50)).toBe(10);
    expect(haftabstand(52 / 100, 4)).toBeCloseTo(0.480769, 6);
  });

  it("unterstützt Abkühlung und unveränderte Temperatur", () => {
    expect(laengenausdehnung(22, 10, -50)).toBeCloseTo(-11, 8);
    expect(laengenausdehnung(22, 10, 0)).toBe(0);
  });

  it("erlaubt gültige Grenzfälle ausdrücklich", () => {
    expect(neigungAusMassen(0, 4)).toBe(0);
    expect(regenwasserabfluss(300, 200, 0)).toBe(0);
    expect(schleppgaube(5, 0, 40, 0).sichthoehe).toBeGreaterThan(0);
    expect(scharen(1, 1)).toEqual({ anzahl: 1, passbreite: 0 });
  });
});


describe("ganze Stückzahlen ohne Gleitkomma-Fehlaufschlag", () => {
  it("rundet rechnerisch ganze Materialmengen nicht um ein Stück hoch", () => {
    expect(materialbedarf(0.07, 100, 0)).toBe(7);
    expect(materialbedarf(0.0701, 100, 0)).toBe(8);
  });
  it("erkennt eine exakt aufgehende Schareneinteilung", () => {
    expect(scharen(0.3, 0.1)).toEqual({ anzahl: 3, passbreite: 0 });
    expect(scharen(0.2999, 0.1).anzahl).toBe(2);
  });
  it("rundet Abläufe sicher auf und prüft die Ablaufleistung", () => {
    expect(ablaufanzahl(6, 5)).toBe(2);
    expect(ablaufanzahl(0.07 * 100, 1)).toBe(7);
    expect(ablaufanzahl(0, 5)).toBe(0);
    expect(() => ablaufanzahl(6, 0)).toThrow(RechenFehler);
    expect(() => ablaufanzahl(-6, 5)).toThrow(RechenFehler);
    expect(() => ablaufanzahl(1e300, 1)).toThrow(RechenFehler);
  });
});
