import { describe, it, expect } from "vitest";
import { wuerfleParameter, berechneSchritte, pruefeAntwort, ersetzePlatzhalter } from "@/lib/calc";

describe("wuerfleParameter", () => {
  it("returns the fixed value when min == max", () => {
    const v = wuerfleParameter([{ name: "a", label: "a", einheit: "m", min: 6, max: 6, schritt: 0.5 }]);
    expect(v.a).toBe(6);
  });
  it("stays within range and rounds to schritt", () => {
    for (let i = 0; i < 50; i++) {
      const v = wuerfleParameter([{ name: "a", label: "a", einheit: "m", min: 3, max: 10, schritt: 0.5 }]);
      expect(v.a).toBeGreaterThanOrEqual(3);
      expect(v.a).toBeLessThanOrEqual(10);
      expect(Number.isInteger(v.a * 2)).toBe(true);
    }
  });
});

describe("berechneSchritte", () => {
  it("evaluates a rechteck area step", () => {
    const s = berechneSchritte(
      [{ beschreibung: "", formel: "laenge*breite", ergebnisName: "flaeche", einheit: "m²" }],
      { laenge: 4, breite: 3 },
    );
    expect(s[0].wert).toBe(12);
  });
  it("chains steps via accumulated scope", () => {
    const s = berechneSchritte(
      [
        { beschreibung: "", formel: "a+b", ergebnisName: "summe", einheit: "" },
        { beschreibung: "", formel: "summe*2", ergebnisName: "doppelt", einheit: "" },
      ],
      { a: 2, b: 3 },
    );
    expect(s[1].wert).toBe(10);
  });
});

describe("pruefeAntwort", () => {
  it("accepts within tolerance", () => {
    expect(pruefeAntwort(11.9, 12, 1)).toBe(true);
  });
  it("rejects outside tolerance", () => {
    expect(pruefeAntwort(10, 12, 1)).toBe(false);
  });
});

describe("ersetzePlatzhalter", () => {
  it("substitutes named placeholders", () => {
    expect(ersetzePlatzhalter("{a} m x {b} m", { a: 4, b: 3 })).toBe("4 m x 3 m");
  });
});
