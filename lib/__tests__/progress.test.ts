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
