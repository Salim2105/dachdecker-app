import { describe, it, expect } from "vitest";
import { serie } from "@/lib/serie";
import type { AufgabenFortschritt } from "@/content/schema";

const TAG = 86_400_000;
const JETZT = new Date("2026-07-29T20:00:00").getTime();

/** Fortschritt aus "vor N Tagen"-Angaben bauen. */
function stand(...vorTagen: number[]): Record<string, AufgabenFortschritt> {
  const f: Record<string, AufgabenFortschritt> = {};
  vorTagen.forEach((n, i) => {
    const t = JETZT - n * TAG;
    f[`a-${i}`] = {
      aufgabeId: `a-${i}`,
      bewertung: "richtig",
      gesehenAm: t,
      faelligAm: t + TAG,
      intervallTage: 1,
    };
  });
  return f;
}

describe("serie", () => {
  it("zählt zusammenhängende Tage bis heute", () => {
    expect(serie(stand(0, 1, 2, 3), JETZT)).toBe(4);
  });

  it("zählt mehrere Aufgaben am selben Tag nur einmal", () => {
    expect(serie(stand(0, 0, 0, 1, 1), JETZT)).toBe(2);
  });

  it("bricht bei einer Lücke ab", () => {
    // Heute, gestern — dann fehlt vorgestern, der Rest zählt nicht mehr mit.
    expect(serie(stand(0, 1, 3, 4, 5), JETZT)).toBe(2);
  });

  it("verliert die Serie nicht, solange der heutige Tag noch läuft", () => {
    // Heute noch nichts geübt: gestern und vorgestern zählen weiter.
    expect(serie(stand(1, 2), JETZT)).toBe(2);
  });

  it("ist vorbei, wenn auch gestern nichts war", () => {
    expect(serie(stand(2, 3, 4), JETZT)).toBe(0);
  });

  it("gibt bei leerem Fortschritt 0 zurück", () => {
    expect(serie({}, JETZT)).toBe(0);
  });

  it("liest nur, schreibt nichts", () => {
    const f = stand(0, 1);
    const vorher = JSON.stringify(f);
    serie(f, JETZT);
    expect(JSON.stringify(f)).toBe(vorher);
  });
});
