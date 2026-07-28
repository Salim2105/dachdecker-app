import { describe, it, expect } from "vitest";
import { filterSichtbar, getLernfelder, getAufgaben } from "@/lib/content";

describe("filterSichtbar", () => {
  it("removes pruefen entries", () => {
    const input = [
      { konfidenz: "hoch" as const },
      { konfidenz: "pruefen" as const },
      { konfidenz: "mittel" as const },
    ];
    expect(filterSichtbar(input)).toHaveLength(2);
  });
});

describe("content loading", () => {
  // LF 13b (Reet) ist wieder in der Liste — Inhalt aus dem Buch S. 564–571 vorhanden.
  it("loads all lernfelder (17 LF inkl. 13a + 13b + WiSo + Anhang 1 bis 3 = 22 entries)", () => {
    expect(getLernfelder().length).toBe(22);
  });
  it("führt kein Lernfeld ohne Aufgaben in der Liste (keine leeren Karten)", () => {
    for (const lf of getLernfelder()) {
      expect(getAufgaben(lf.id).length, `${lf.id} hat keine Aufgaben`).toBeGreaterThan(0);
    }
  });
  it("returns only visible aufgaben for lf01", () => {
    expect(getAufgaben("lf01").every((a) => a.konfidenz !== "pruefen")).toBe(true);
  });
});

describe("Lückentext-Antworten", () => {
  it("jede Antwort mit Umlaut hat eine Alternative ohne Umlaut", () => {
    // Sonst kommt niemand weiter, der auf dem Tablet ohne Umlaute tippt.
    for (const lf of getLernfelder()) {
      for (const a of getAufgaben(lf.id)) {
        if (a.typ !== "cloze") continue;
        for (const [antwort, alternativen] of Object.entries(a.akzeptiert ?? {})) {
          if (!/[äöüß]/.test(antwort)) continue;
          const hatAscii = alternativen.some((alt) => /ae|oe|ue|ss/i.test(alt));
          expect(hatAscii, `${a.id}: "${antwort}" ohne ASCII-Alternative`).toBe(true);
        }
      }
    }
  });
});
