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
  it("loads all lernfelder (17 LF + 13b split + WiSo = 19 entries)", () => {
    expect(getLernfelder().length).toBe(19);
  });
  it("returns only visible aufgaben for lf01", () => {
    expect(getAufgaben("lf01").every((a) => a.konfidenz !== "pruefen")).toBe(true);
  });
});
