import { describe, it, expect } from "vitest";
import { saetze } from "@/lib/saetze";

// Jeder Fall hier ist beim Durchlauf über die echten 2039 Erklärungen
// aufgefallen, nicht ausgedacht. Ein naiver Schnitt an ".!?" zerlegt deutsche
// Fachtexte mitten im Satz — die Beispiele halten fest, wo.
describe("saetze", () => {
  it("trennt an echten Satzgrenzen", () => {
    expect(saetze("Der First liegt oben. Die Traufe liegt unten.")).toEqual([
      "Der First liegt oben.",
      "Die Traufe liegt unten.",
    ]);
  });

  it("trennt nicht an Ordnungszahlen (lf08-029: '19. Jahrhundert')", () => {
    const t = "Herzziegel stammen aus Mitte 19. Jahrhundert. Sie sind verfalzt.";
    expect(saetze(t)).toHaveLength(2);
    expect(saetze(t)[0]).toContain("19. Jahrhundert");
  });

  it("trennt nicht in nummerierten Aufzählungen (lf03-092)", () => {
    const t = "Die fünf Schritte: 1. Rohstoff-Abbau, 2. Aufbereitung, 3. Formgebung.";
    expect(saetze(t)).toHaveLength(1);
  });

  it("trennt nicht bei 'z. B.' und Seitenangaben", () => {
    expect(saetze("Metalle, z. B. Kupfer, sind dicht.")).toHaveLength(1);
    expect(saetze("Siehe S. 497 für die Tabelle.")).toHaveLength(1);
  });

  it("trennt nicht bei '(z. B. …)' in Klammern (lf01-034)", () => {
    // Vor dem "z." steht hier eine Klammer statt eines Leerzeichens.
    const t =
      "Offene Dreiecke kennzeichnen fertige Höhenlagen (z. B. OK fertiger Fußboden), angelegte die Rohbauhöhen (z. B. OK Rohdecke).";
    expect(saetze(t)).toHaveLength(1);
  });

  it("trennt nicht bei gängigen Abkürzungen", () => {
    expect(saetze("Die Neigung beträgt ca. 30 Grad.")).toHaveLength(1);
    expect(saetze("Kupfer bzw. Zink kommen infrage.")).toHaveLength(1);
  });

  it("lässt Formeln als eigenen Satz stehen", () => {
    // "R = d/λ." auf eigener Zeile ist lesbarer als im Absatz vergraben.
    const t = "Der Wärmedurchlasswiderstand wird berechnet. R = d/λ. Die Einheit ist m²K/W.";
    expect(saetze(t)).toEqual([
      "Der Wärmedurchlasswiderstand wird berechnet.",
      "R = d/λ.",
      "Die Einheit ist m²K/W.",
    ]);
  });

  it("gibt einen einzelnen Satz unverändert zurück", () => {
    expect(saetze("  Ein Satz ohne Besonderheiten.  ")).toEqual(["Ein Satz ohne Besonderheiten."]);
  });
});
