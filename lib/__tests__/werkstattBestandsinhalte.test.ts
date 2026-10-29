import { describe, expect, it } from "vitest";
import lf02 from "@/content/lf02/lektionen.json";
import lf08 from "@/content/lf08/lektionen.json";
import { getLektionen } from "@/lib/content";
import { WERKSTATT_SYSTEMKARTEN } from "@/lib/werkstattInhalte";

const lektion = (id: string) => {
  const wert = [...lf02, ...lf08].find(l => l.id === id);
  if (!wert) throw new Error(`Bestandslektion fehlt: ${id}`);
  return wert;
};
const text = (id: string) => lektion(id).inhalt.join(" ");

describe("Direkt verknüpfte Bestandslektionen für das Werkstatttraining", () => {
  it("hält den ungeprüften Windsog-Altbestand weiterhin aus der sichtbaren Lehre heraus", () => {
    expect(lektion("lf08-l07").konfidenz).toBe("pruefen");
    expect(getLektionen("lf08").some(l => l.id === "lf08-l07")).toBe(false);
    expect(text("lf08-l07")).not.toContain("DIN 1055-4");
    expect(text("lf08-l07")).toContain("Gefährdungsbeurteilung");
    expect(text("lf08-l07")).toContain("Befestigungsplan");
  });

  it("gibt bei Fehlkanten nicht mehr zwei gegensätzliche allgemeine Einbauregeln vor", () => {
    for (const id of ["lf02-l06", "lf08-l18"]) {
      expect(text(id)).toMatch(/Auflage/);
      expect(text(id)).toContain("Ausführungsangaben");
      expect(text(id)).not.toContain("Baumkante darf nur in Richtung Traufe");
      expect(text(id)).not.toContain("Kante, die zur Traufe zeigt, muss fehlkantenfrei");
    }
  });

  it("bezeichnet die 17 Längsabstände als 18 begrenzende Latten und rundet erst das Ergebnis", () => {
    const laenge = 615 - 30 - 4.5;
    const abstaende = Math.ceil(laenge / 34.3);
    expect(laenge).toBe(580.5);
    expect(abstaende).toBe(17);
    expect(abstaende + 1).toBe(18);
    expect(Number((laenge / abstaende).toFixed(2))).toBe(34.15);
    expect(laenge / abstaende).toBeGreaterThan(33.9);
    expect(laenge / abstaende).toBeLessThan(34.3);
    expect(text("lf08-l12")).toContain("n + 1 Lattenreihen");
    expect(text("lf08-l23")).toContain("17 Abstände zwischen 18 Bezugslatten");
    expect(text("lf08-l23")).toContain("34,15 cm");
    expect(text("lf08-l23")).not.toContain("34,14 cm");
  });

  it("unterscheidet Deckbreiten von Längsabständen im erhaltenen Quellenbeispiel", () => {
    const breite = 1075 + 2 * 10.5 - 23.6 - 27.5;
    expect(breite).toBeCloseTo(1044.9, 8);
    expect(Math.ceil(breite / 21.7)).toBe(49);
    expect(Number((breite / 49).toFixed(2))).toBe(21.32);
    expect(text("lf08-l23")).toContain("49 Deckbreiten");
    expect(text("lf08-l23")).toContain("Aufgabenwert");
  });

  it("prüft die beiden Schulmodelle unabhängig als Geometrie und nicht als Produktfreigabe", () => {
    const f = WERKSTATT_SYSTEMKARTEN.falzziegel;
    expect(f.masse.feldLaenge).toBe(204);
    expect(f.masse.feldBreite).toBe(120);
    expect(f.masse.feldLaenge / 6).toBe(34);
    expect(f.masse.feldBreite / 5).toBe(24);
    expect(f.masse.deckLaenge).toBeGreaterThanOrEqual(f.masse.minDeckLaenge);
    expect(f.masse.deckLaenge).toBeLessThanOrEqual(f.masse.maxDeckLaenge);

    const b = WERKSTATT_SYSTEMKARTEN["biber-doppel"];
    expect(b.masse.ziegelLaenge).toBe(38);
    expect((38 - 8) / 2).toBe(15);
    expect(b.masse.deckLaenge).toBe(15);
    expect(38 - b.masse.deckLaenge).toBe(23);
    expect(38 - 2 * b.masse.deckLaenge).toBe(8);
    expect(b.masse.ziegelBreite + 0.2).toBe(18);
    expect(b.masse.feldLaenge / 6).toBe(15);
    expect(b.masse.feldBreite / 5).toBe(18);
    for (const karte of [f, b]) {
      expect(karte.hinweis).toContain("Schulmodell");
      expect(karte.hinweis).toContain("keine allgemeinen Ausführungsregeln");
    }
  });
});
