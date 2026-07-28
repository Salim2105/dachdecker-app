import { describe, it, expect } from "vitest";
import type { AufgabenFortschritt } from "@/content/schema";
import { reife, tagesdosis, istVerkettet, MIN_DOSIS, MAX_DOSIS } from "@/lib/tagesplan";

const TAG = 86_400_000;
const JETZT = 1_800_000_000_000;

function eintrag(over: Partial<AufgabenFortschritt> = {}): AufgabenFortschritt {
  return {
    aufgabeId: "x",
    bewertung: "richtig",
    gesehenAm: JETZT,
    faelligAm: JETZT + 4 * TAG,
    intervallTage: 4,
    ...over,
  };
}

describe("reife", () => {
  it("zählt eine unbearbeitete Aufgabe als null", () => {
    expect(reife(undefined, JETZT)).toBe(0);
  });

  it("gibt einer frisch richtigen Aufgabe volle Reife", () => {
    expect(reife(eintrag(), JETZT)).toBe(1);
  });

  it("wertet teilweise richtig als halbe Reife", () => {
    expect(reife(eintrag({ bewertung: "teilweise" }), JETZT)).toBe(0.5);
  });

  it("gibt einer falschen Antwort keine Reife", () => {
    expect(reife(eintrag({ bewertung: "falsch" }), JETZT)).toBe(0);
  });

  // Der Kern: liegen gebliebene Wiederholungen senken die Reife. Ein Wert,
  // der nur steigen kann, würde Wissen vortäuschen, das längst verfallen ist.
  it("verfällt, sobald die Aufgabe überfällig wird", () => {
    const f = eintrag({ faelligAm: JETZT - 4 * TAG, intervallTage: 4 });
    const r = reife(f, JETZT);
    expect(r).toBeLessThan(1);
    expect(r).toBeGreaterThan(0);
  });

  it("ist nach dem doppelten Intervall vollständig verfallen", () => {
    const f = eintrag({ faelligAm: JETZT - 8 * TAG, intervallTage: 4 });
    expect(reife(f, JETZT)).toBe(0);
  });

  it("verfällt umso weiter, je länger die Aufgabe liegen bleibt", () => {
    const frueh = reife(eintrag({ faelligAm: JETZT - 2 * TAG, intervallTage: 4 }), JETZT);
    const spaet = reife(eintrag({ faelligAm: JETZT - 6 * TAG, intervallTage: 4 }), JETZT);
    expect(spaet).toBeLessThan(frueh);
  });
});

describe("tagesdosis", () => {
  const grad = { anteil: 0, punkte: 0, gesamt: 1000, faellig: 0, neu: 1000 };

  it("verteilt die offene Menge auf die verbleibenden Tage", () => {
    expect(tagesdosis(grad, 100)).toBe(10);
    expect(tagesdosis(grad, 50)).toBe(20);
  });

  it("bleibt ohne Prüfungstermin bei der Mindestdosis", () => {
    expect(tagesdosis(grad, null)).toBe(MIN_DOSIS);
  });

  it("hält die Mindestdosis auch bei viel Zeit", () => {
    expect(tagesdosis(grad, 5000)).toBe(MIN_DOSIS);
  });

  // Am Tag vor der Prüfung nützt eine Dosis von 900 Aufgaben niemandem mehr.
  it("deckelt die Dosis, wenn die Zeit knapp wird", () => {
    expect(tagesdosis(grad, 1)).toBe(MAX_DOSIS);
    expect(tagesdosis(grad, 0)).toBe(MIN_DOSIS);
  });

  it("rechnet bereits gefestigte Aufgaben heraus", () => {
    const halb = { ...grad, punkte: 500 };
    expect(tagesdosis(halb, 50)).toBe(10);
  });
});

describe("istVerkettet", () => {
  const basis = {
    id: "a",
    lernfeld: "lf01",
    thema: "t",
    quelle: "q",
    konfidenz: "hoch" as const,
    erklaerung: "e",
  };

  it("erkennt mehrschrittige Rechenaufgaben als verkettet", () => {
    const a = {
      ...basis,
      typ: "calc" as const,
      aufgabentext: "x",
      parameter: [],
      toleranzProzent: 2,
      schritte: [
        { beschreibung: "1", formel: "1", ergebnisName: "r", einheit: "" },
        { beschreibung: "2", formel: "r*2", ergebnisName: "u", einheit: "" },
      ],
    };
    expect(istVerkettet(a)).toBe(true);
  });

  it("behandelt eine einschrittige Rechenaufgabe als atomar", () => {
    const a = {
      ...basis,
      typ: "calc" as const,
      aufgabentext: "x",
      parameter: [],
      toleranzProzent: 2,
      schritte: [{ beschreibung: "1", formel: "1", ergebnisName: "r", einheit: "" }],
    };
    expect(istVerkettet(a)).toBe(false);
  });

  it("behandelt Multiple-Choice als atomar", () => {
    const a = { ...basis, typ: "mc" as const, frage: "f", optionen: ["a", "b"], korrekt: [0] };
    expect(istVerkettet(a)).toBe(false);
  });
});
