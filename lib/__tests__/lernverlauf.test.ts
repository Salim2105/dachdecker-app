import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ladeFortschritt, speichereBewertung } from "@/lib/progress";
import { lernStatus, themenStand } from "@/lib/lernstand";
import type { Aufgabe } from "@/content/schema";

const TAG = 86_400_000;
const JETZT = new Date("2026-01-10T12:00:00Z").getTime();
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(JETZT); });
afterEach(() => vi.useRealTimers());

describe("Lernverlauf", () => {
  it("verlangt erfolgreiche Abrufe an drei verschiedenen Tagen", () => {
    speichereBewertung("a", "richtig");
    const erster = ladeFortschritt().a;
    expect(lernStatus(erster, JETZT)).toBe("erinnert");
    speichereBewertung("a", "richtig");
    expect(ladeFortschritt().a.faelligAm).toBe(erster.faelligAm);
    expect(lernStatus(ladeFortschritt().a, JETZT)).not.toBe("gefestigt");
    vi.setSystemTime(JETZT + 2 * TAG);
    speichereBewertung("a", "richtig");
    vi.setSystemTime(JETZT + 6 * TAG);
    speichereBewertung("a", "richtig");
    expect(lernStatus(ladeFortschritt().a, Date.now())).toBe("gefestigt");
    expect(lernStatus(ladeFortschritt().a, ladeFortschritt().a.faelligAm)).toBe("faellig");
  });

  it("zählt Hilfen und kurzfristiges Lernen nicht als gefestigtes Wissen", () => {
    for (let i = 0; i < 3; i++) {
      vi.setSystemTime(JETZT + i * TAG);
      speichereBewertung("hilfe", "richtig", { mitHilfe: true });
      speichereBewertung("theorie", "richtig", { nachErklaerung: true });
    }
    expect(lernStatus(ladeFortschritt().hilfe, Date.now())).toBe("unsicher");
    expect(lernStatus(ladeFortschritt().theorie, Date.now())).toBe("faellig");
    expect(ladeFortschritt().hilfe.intervallTage).toBe(1);
  });

  it("plant bei wiederholten Fehlern trotz eines richtigen Abrufs früher", () => {
    speichereBewertung("problem", "falsch");
    vi.setSystemTime(JETZT + TAG);
    speichereBewertung("problem", "falsch");
    vi.setSystemTime(JETZT + 2 * TAG);
    speichereBewertung("problem", "richtig");
    vi.setSystemTime(JETZT + 4 * TAG);
    speichereBewertung("problem", "richtig");
    expect(ladeFortschritt().problem.intervallTage).toBeLessThanOrEqual(3);
  });

  it("setzt nach einem neuen Fehler auch eine alte Erfolgsserie zurück", () => {
    for (let i = 0; i < 3; i++) { vi.setSystemTime(JETZT + i * TAG); speichereBewertung("a", "richtig"); }
    speichereBewertung("a", "falsch", { nachErklaerung: true });
    expect(ladeFortschritt().a.bewertung).toBe("falsch");
    expect(ladeFortschritt().a.intervallTage).toBe(1);
    vi.setSystemTime(JETZT + 3 * TAG);
    speichereBewertung("a", "richtig");
    expect(lernStatus(ladeFortschritt().a, Date.now())).toBe("erinnert");
  });

  it("erhält alte Lernstände, ohne eine Vergangenheit zu erfinden", () => {
    localStorage.setItem("fortschritt-v1", JSON.stringify({ alt: {
      aufgabeId: "alt", bewertung: "richtig", gesehenAm: JETZT - TAG, faelligAm: JETZT + TAG, intervallTage: 2,
    } }));
    expect(lernStatus(ladeFortschritt().alt, JETZT)).toBe("erinnert");
    speichereBewertung("alt", "richtig");
    expect(ladeFortschritt().alt.verlauf).toHaveLength(1);
    expect(lernStatus(ladeFortschritt().alt, JETZT)).toBe("erinnert");
  });

  it("verlängert ein Intervall nicht durch mehrere teilweise richtige Versuche am selben Tag", () => {
    speichereBewertung("teil", "teilweise");
    const vorher = ladeFortschritt().teil.intervallTage;
    for (let i = 0; i < 4; i++) speichereBewertung("teil", "teilweise");
    expect(ladeFortschritt().teil.intervallTage).toBe(vorher);
    expect(lernStatus(ladeFortschritt().teil, JETZT)).toBe("unsicher");
  });

  it("behält einen mehrfachen Abruf bei, ohne einen zusätzlichen Versuch am selben Tag aufzuwerten", () => {
    for (let i = 0; i < 3; i++) { vi.setSystemTime(JETZT + i * TAG); speichereBewertung("a", "richtig"); }
    const vorher = ladeFortschritt().a.faelligAm;
    speichereBewertung("a", "richtig");
    expect(ladeFortschritt().a.faelligAm).toBe(vorher);
    expect(lernStatus(ladeFortschritt().a, Date.now())).toBe("gefestigt");
  });

  it("hält gleichnamige Themen verschiedener Lernfelder getrennt", () => {
    const aufgabe = (lf: string): Aufgabe => ({ id: lf, lernfeld: lf, thema: "Material", typ: "mc", frage: "?", optionen: ["A"], korrekt: [0], quelle: "Test", konfidenz: "hoch", erklaerung: "Test" });
    const themen = themenStand([aufgabe("lf01"), aufgabe("lf02")], {}, JETZT);
    expect(themen).toHaveLength(2);
    expect(themen[0].zahlen.neu).toBe(1);
  });
});
