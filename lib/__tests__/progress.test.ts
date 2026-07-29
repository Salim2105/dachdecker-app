import { describe, it, expect, beforeEach } from "vitest";
import {
  naechsteFaelligkeit,
  speichereBewertung,
  ladeFortschritt,
  lernfeldFortschritt,
} from "@/lib/progress";

beforeEach(() => localStorage.clear());

describe("spaced repetition", () => {
  it("resets interval on falsch", () => {
    expect(naechsteFaelligkeit("falsch", 8).intervallTage).toBe(1);
  });
  it("grows interval on richtig", () => {
    expect(naechsteFaelligkeit("richtig", 2).intervallTage).toBeGreaterThan(2);
  });

  // Dieser Ast hatte keinen Test, und genau dort saß der Fehler: "teilweise"
  // stand auf Math.max(1, intervallTage) und wuchs nie. Weil der Startwert 0
  // ist, blieb jede so bewertete Aufgabe dauerhaft auf einem Tag — sie kam
  // jeden Abend wieder. ClozeCard und DiagramCard vergeben "teilweise"
  // automatisch bei Teilerfolg, dort war es also nicht einmal eine Entscheidung
  // des Nutzers.
  it("lässt das Intervall bei teilweise wachsen, statt es einzufrieren", () => {
    let i = 0;
    const verlauf: number[] = [];
    for (let n = 0; n < 5; n++) {
      i = naechsteFaelligkeit("teilweise", i).intervallTage;
      verlauf.push(i);
    }
    expect(verlauf[0]).toBeGreaterThanOrEqual(2);
    // Streng monoton — kein Wiederholungsabo auf demselben Abstand.
    for (let n = 1; n < verlauf.length; n++) {
      expect(verlauf[n]).toBeGreaterThan(verlauf[n - 1]);
    }
  });

  it("lässt teilweise langsamer wachsen als richtig", () => {
    expect(naechsteFaelligkeit("teilweise", 8).intervallTage).toBeLessThan(
      naechsteFaelligkeit("richtig", 8).intervallTage,
    );
  });

  it("startet bei allen Ästen mit einem brauchbaren Intervall", () => {
    // Startwert ist 0 (speichereBewertung: `?? 0`) — das darf nirgends zu 0 führen.
    for (const b of ["falsch", "teilweise", "richtig"] as const) {
      expect(naechsteFaelligkeit(b, 0).intervallTage).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("store", () => {
  it("persists a rating and reads it back", () => {
    speichereBewertung("lf01-001", "richtig");
    expect(ladeFortschritt()["lf01-001"].bewertung).toBe("richtig");
  });
  it("computes lernfeld completion fraction", () => {
    speichereBewertung("lf01-001", "richtig");
    expect(lernfeldFortschritt("lf01", ["lf01-001", "lf01-002"])).toBe(0.5);
  });
});
