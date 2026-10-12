import { describe, expect, it } from "vitest";
import { PRAXISFAELLE } from "@/lib/praxis";
import { praxisFeedback, calcFeedback } from "@/lib/rechenFeedback";
import { berechneSchritte } from "@/lib/calc";
import { leseDezimalzahl } from "@/lib/zahlen";

describe("Gezielte Rückmeldung", () => {
  it("unterscheidet Zuschlag allein und vergessenen Zuschlag", () => {
    const nurZuschlag = praxisFeedback("satteldach", 2, ["120", "1200", "96"]);
    const ohneZuschlag = praxisFeedback("satteldach", 2, ["120", "1200", "1200"]);
    expect(nurZuschlag?.titel).toBe("Zuschlag und Gesamtmenge unterscheiden");
    expect(ohneZuschlag?.titel).toBe("Zuschlag berücksichtigen");
    expect(nurZuschlag?.uebung?.ergebnis).toBeCloseTo(200 * 1.15);
  });
  it("erkennt passende Geometrie-, Einheiten-, Überdeckungs- und Rundungsmuster", () => {
    expect(praxisFeedback("satteldach", 0, ["60"])?.uebung?.ergebnis).toBe(2 * 8 * 4);
    expect(praxisFeedback("dachschraege", 2, ["4", "5", "80"])?.titel).toBe("Dachfläche statt Grundfläche");
    expect(praxisFeedback("gefaelle", 0, ["0,12"])?.uebung?.ergebnis).toBe(0.35 * 100);
    expect(praxisFeedback("platten", 2, ["40", "44", "61"])?.uebung?.ergebnis).toBe(Math.ceil(10 / 0.8));
    expect(praxisFeedback("bahnen", 0, ["1"])?.uebung?.ergebnis).toBeCloseTo(1.2 - 0.15);
    expect(praxisFeedback("regen", 2, ["15", "1800", "60"])?.uebung?.ergebnis).toBe(600 / (10 * 60));
  });
  it("unterscheidet fortgesetzte Folgefehler von einem neuen Rechenfehler", () => {
    const weiter = praxisFeedback("satteldach", 1, ["60", "600", "648"]);
    expect(weiter?.titel).toBe("Vorherigen Schritt zuerst prüfen");
    expect(weiter?.hinweis).toContain("Schritt 1");
    expect(weiter?.uebung).toBeUndefined();
    expect(praxisFeedback("satteldach", 2, ["60", "600", "648"])?.hinweis).toContain("Schritt 2");
    expect(praxisFeedback("platten", 2, ["40", "40", "56"])?.titel).toBe("Vorherigen Schritt zuerst prüfen");
  });
  it("gibt richtigen Antworten und unbekannten Fällen keine Fehlerdiagnose", () => {
    for (const fall of PRAXISFAELLE) {
      const eingaben = fall.rechnungen.map((r) => String(r.ergebnis));
      fall.rechnungen.forEach((_r, i) => expect(praxisFeedback(fall.id, i, eingaben)).toBeNull());
    }
    expect(praxisFeedback("unbekannt", 0, ["60"])).toBeNull();
    expect(praxisFeedback("satteldach", 9, ["60"])).toBeNull();
    expect(praxisFeedback("satteldach", 0, ["37"])?.titel).toBe("Rechenweg vergleichen");
    expect(praxisFeedback("satteldach", 0, ["37"])?.uebung).toBeUndefined();
  });
  it("erklärt fehlerhafte Eingaben als Formatproblem", () => {
    expect(praxisFeedback("satteldach", 0, ["120 m²"])?.titel).toBe("Zahleneingabe prüfen");
  });
  it("erkennt ein Zwischenergebnis einer mehrstufigen Rechnung", () => {
    const schritte = berechneSchritte([
      { beschreibung: "Fläche", formel: "8*5", ergebnisName: "a", einheit: "m²" },
      { beschreibung: "Zuschlag", formel: "a*1.1", ergebnisName: "b", einheit: "m²" },
    ], {});
    expect(calcFeedback(40, schritte).hinweis).toContain("Schritt 1");
    expect(calcFeedback(27, schritte).titel).toBe("Rechenweg Schritt für Schritt prüfen");
  });
});

describe("Zahleneingabe", () => {
  it("akzeptiert Dezimalkomma, Vorzeichen und Null ohne Teilwerte aus ungültigem Text zu übernehmen", () => {
    expect(leseDezimalzahl(" 1,05 ")).toBe(1.05);
    expect(leseDezimalzahl("-0.5")).toBe(-0.5);
    expect(leseDezimalzahl("0")).toBe(0);
    for (const text of ["", "12abc", "12 m", "1,2,3", "Infinity", "0x10", "1e3", "1.200,5"]) expect(leseDezimalzahl(text)).toBeNull();
  });
});
