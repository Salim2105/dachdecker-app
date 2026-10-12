import { describe, expect, it } from "vitest";
import { getAufgaben, getLektionen, getLernfelder } from "@/lib/content";
import { ersetzePlatzhalter } from "@/lib/calc";

describe("Maße in Rechenaufgaben", () => {
  it("zeigt eingesetzte Maße statt ungelöster Platzhalter in allen sichtbaren Aufgaben", () => {
    for (const lf of getLernfelder()) {
      for (const a of getAufgaben(lf.id)) {
        if (a.typ !== "calc") continue;
        const werte = Object.fromEntries(a.parameter.map((p) => [p.name, p.min]));
        expect(ersetzePlatzhalter(a.aufgabentext, werte), a.id).not.toMatch(/\{[^}]+\}/);
      }
    }
  });
  it("zeigt konkrete Behältergrößen und Dachüberstände", () => {
    const b = getAufgaben("anhang1").find((a) => a.id === "anhang1-059");
    const u = getAufgaben("lf15").find((a) => a.id === "lf15-030");
    if (b?.typ !== "calc" || u?.typ !== "calc") throw new Error("Prüfaufgabe fehlt");
    expect(ersetzePlatzhalter(b.aufgabentext, { volumen: 100, behaelter: 12 })).toContain("mit 12 m³ Inhalt");
    expect(ersetzePlatzhalter(u.aufgabentext, { alpha: 40, beta: 25, sges: 4.3, ue: 0.25 })).toContain("davon 0.25 m Überstand");
  });
});

describe("Noch nicht bestätigte Sicherheitseinträge", () => {
  it("fragt die zurückgestellte Absturzhöhe nicht als gesicherte Regel ab", () => {
    expect(getAufgaben("lf08").some((a) => a.id === "lf08-082")).toBe(false);
    expect(getLektionen("lf08").some((l) => l.id === "lf08-l07")).toBe(false);
  });
});
