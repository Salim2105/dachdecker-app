import { describe, expect, it } from "vitest";
import {
  getPruefungsteile,
  poolFuer,
  zieheAufgaben,
  istAutoBewertbar,
  prozentFuer,
  noteFuer,
  bestanden,
  formatiereZeit,
  punkteFuer,
  pruefungsprotokoll,
} from "@/lib/pruefung";
import type { Aufgabe } from "@/content/schema";

describe("Prüfungsteile", () => {
  it("Teil 1 enthält genau die Lernfelder 1 bis 9", () => {
    const teil1 = getPruefungsteile().find((t) => t.id === "teil1")!;
    expect(teil1.lernfelder).toEqual([
      "lf01",
      "lf02",
      "lf03",
      "lf04",
      "lf05",
      "lf06",
      "lf07",
      "lf08",
      "lf09",
    ]);
  });

  it("Teil 2 enthält kein WiSo", () => {
    const teil2 = getPruefungsteile().find((t) => t.id === "teil2")!;
    expect(teil2.lernfelder).not.toContain("wiso");
  });

  it("zieht nur automatisch bewertbare Aufgaben", () => {
    for (const teil of getPruefungsteile()) {
      const pool = poolFuer(teil);
      expect(pool.length).toBeGreaterThan(0);
      expect(pool.every(istAutoBewertbar)).toBe(true);
      expect(pool.some((a) => a.typ === "draw" || a.typ === "fachbegriff")).toBe(false);
    }
  });

  it("jeder Teil hat genug Aufgaben für einen vollen Durchlauf", () => {
    for (const teil of getPruefungsteile()) {
      expect(poolFuer(teil).length).toBeGreaterThanOrEqual(teil.anzahl);
    }
  });
});

describe("zieheAufgaben", () => {
  const pool = Array.from({ length: 10 }, (_, i) => ({ id: `a${i}` }) as Aufgabe);

  it("zieht die gewünschte Anzahl ohne Wiederholung", () => {
    const gezogen = zieheAufgaben(pool, 4);
    expect(gezogen).toHaveLength(4);
    expect(new Set(gezogen.map((a) => a.id)).size).toBe(4);
  });

  it("liefert höchstens so viele Aufgaben wie vorhanden", () => {
    expect(zieheAufgaben(pool, 99)).toHaveLength(10);
  });
});

describe("Bewertung", () => {
  it("teilweise richtig zählt einen halben Punkt", () => {
    expect(punkteFuer("richtig")).toBe(1);
    expect(punkteFuer("teilweise")).toBe(0.5);
    expect(punkteFuer("falsch")).toBe(0);
  });

  it("nicht bearbeitete Aufgaben zählen als 0", () => {
    expect(prozentFuer(["richtig", "richtig"], 4)).toBe(50);
  });

  it("ordnet Prozentwerte den Notenstufen zu", () => {
    expect(noteFuer(100).note).toBe(1);
    expect(noteFuer(92).note).toBe(1);
    expect(noteFuer(91).note).toBe(2);
    expect(noteFuer(67).note).toBe(3);
    expect(noteFuer(50).note).toBe(4);
    expect(noteFuer(49).note).toBe(5);
    expect(noteFuer(0).note).toBe(6);
  });

  it("ab 50 Prozent bestanden", () => {
    expect(bestanden(50)).toBe(true);
    expect(bestanden(49.9)).toBe(false);
  });
});

describe("formatiereZeit", () => {
  it("formatiert Minuten und Sekunden", () => {
    expect(formatiereZeit(0)).toBe("00:00");
    expect(formatiereZeit(65)).toBe("01:05");
    expect(formatiereZeit(2700)).toBe("45:00");
  });

  it("zeigt bei negativer Restzeit null", () => {
    expect(formatiereZeit(-30)).toBe("00:00");
  });
});

describe("pruefungsprotokoll", () => {
  const mc = (id: string, lf: string): Aufgabe => ({
    id,
    typ: "mc",
    lernfeld: lf,
    thema: "t",
    quelle: `Buch S. ${id}`,
    konfidenz: "hoch",
    erklaerung: `Erklärung zu ${id}`,
    frage: `Frage ${id}?`,
    optionen: ["a", "b"],
    korrekt: [0],
  });

  const aufgaben = [mc("001", "lf01"), mc("002", "lf02"), mc("003", "lf01")];
  const JETZT = 1_800_000_000_000;

  it("nennt Ergebnis, Note und Bestehen", () => {
    const t = pruefungsprotokoll("Teil 1", aufgaben, ["richtig", "richtig", "falsch"], JETZT);
    expect(t).toContain("Teil 1");
    expect(t).toContain("67 %");
    expect(t).toContain("bestanden");
  });

  // Der eigentliche Zweck: Was man falsch hatte, samt Erklärung zum Nacharbeiten.
  it("führt nur die nicht vollständig richtigen Aufgaben auf", () => {
    const t = pruefungsprotokoll("Teil 1", aufgaben, ["richtig", "falsch", "teilweise"], JETZT);
    expect(t).toContain("Zum Nacharbeiten (2)");
    expect(t).toContain("Frage 002?");
    expect(t).toContain("Erklärung zu 003");
    expect(t).not.toContain("Frage 001?");
  });

  it("zählt unbeantwortete Aufgaben zum Nacharbeiten", () => {
    const t = pruefungsprotokoll("Teil 1", aufgaben, ["richtig"], JETZT);
    expect(t).toContain("Zum Nacharbeiten (2)");
    expect(t).toContain("nicht bearbeitet");
  });

  it("schlüsselt nach Lernfeld auf", () => {
    const t = pruefungsprotokoll("Teil 1", aufgaben, ["richtig", "falsch", "richtig"], JETZT);
    expect(t).toContain("Nach Lernfeld");
    expect(t).toMatch(/lf01\s+2 \/ 2/);
    expect(t).toMatch(/lf02\s+0 \/ 1/);
  });
});
