import { describe, expect, it } from "vitest";
import { MATHE_EINHEITEN, pruefeMathe } from "@/lib/matheGrundlagen";

const aufgabe = (id: string) => {
  const a = MATHE_EINHEITEN.flatMap((e) => e.fragen).find((f) => f.id === id);
  if (!a) throw new Error(`Aufgabe fehlt: ${id}`);
  return a;
};

// Unabhängig nachgerechnete Ergebnisse: nicht die gespeicherten Lösungswerte
// zurück in die Prüfung einsetzen, sonst würde ein falscher Datensatz bestehen.
const loesungen: [string, string, string][] = [
  ["laenge-1", "240", "cm"], ["laenge-2", "3,5", "cm"], ["laenge-3", "1,55", "m"],
  ["flaecheneinheit-1", "20000", "cm²"], ["flaecheneinheit-2", "2,5", "m²"], ["flaecheneinheit-3", "0,6", "m²"],
  ["bruch-1", "0,75", "m"], ["bruch-2", "0,75", "m"], ["bruch-3", "0,75", "m"],
  ["prozent-1", "20", "Stück"], ["prozent-2", "220", "Stück"], ["prozent-3", "84", "m²"],
  ["dreisatz-1", "12", "Stück/m²"], ["dreisatz-2", "300", "Stück"], ["dreisatz-3", "45", "€"],
  ["flaeche-1", "60", "m²"], ["flaeche-2", "120", "m²"], ["flaeche-3", "6", "m²"],
  ["pythagoras-1", "4", "m"], ["pythagoras-2", "5", "m"], ["pythagoras-3", "10", "m"],
  ["massstab-1", "12", "cm"], ["massstab-2", "4", "m"], ["massstab-3", "40", "cm"],
  ["gefaelle-1", "12", "cm"], ["gefaelle-2", "0,12", "m"], ["gefaelle-3", "2", "%"],
  ["volumen-1", "1", "m³"], ["volumen-2", "0,6", "m³"], ["volumen-3", "1", "m³"],
];

describe("Fachmathe: Rechenwerte und Einheiten", () => {
  it.each(loesungen)("bestätigt das unabhängig berechnete Ergebnis von %s", (id, wert, einheit) => {
    expect(pruefeMathe(aufgabe(id), wert, einheit)?.richtig).toBe(true);
  });
  it("deckt alle Übungen genau einmal ab und lässt falsche Stückzahlen nicht als Rundung gelten", () => {
    expect(new Set(loesungen.map(([id]) => id))).toEqual(new Set(MATHE_EINHEITEN.flatMap((e) => e.fragen.map((f) => f.id))));
    expect(pruefeMathe(aufgabe("prozent-2"), "219", "Stück")?.richtig).toBe(false);
    expect(pruefeMathe(aufgabe("flaecheneinheit-1"), "20000,001", "cm²")?.richtig).toBe(false);
  });
  it.each(["", " ", "\t\n", "240cm", "240 cm", "240abc", "2,4,0", "2.4.0", "Infinity", "NaN", "0xF0", "2.4e2", "200+40", "3/4", "−240"])("bewertet die unvollständige oder unzulässige Eingabe %j nicht", (text) => {
    expect(pruefeMathe(aufgabe("laenge-1"), text, "cm")).toBeNull();
  });
  it("benötigt eine ausgewählte Einheit und unterscheidet falsche Einheit von falscher Zahl", () => {
    const a = aufgabe("laenge-1");
    expect(pruefeMathe(a, "240", "")).toBeNull();
    expect(pruefeMathe(a, "240", "kg")).toBeNull();
    expect(pruefeMathe(a, "240", "m")).toMatchObject({ richtig: false, kategorie: "einheiten" });
    expect(pruefeMathe(a, " 240 ", "cm")?.richtig).toBe(true);
    expect(pruefeMathe(a, "-240", "cm")?.richtig).toBe(false);
  });
  it("erkennt den Längenfaktor statt des quadrierten Flächenfaktors", () => {
    const r = pruefeMathe(aufgabe("flaecheneinheit-1"), "200", "cm²");
    expect(r).toMatchObject({ richtig: false, kategorie: "einheiten" });
    expect(r?.hinweis).toMatch(/quadriert/);
  });
  it("unterscheidet Reserve und Gesamtmenge", () => {
    expect(pruefeMathe(aufgabe("prozent-1"), "20", "Stück")?.richtig).toBe(true);
    const gesamt = pruefeMathe(aufgabe("prozent-2"), "20", "Stück");
    expect(gesamt).toMatchObject({ richtig: false, kategorie: "formel" });
    expect(gesamt?.hinweis).toMatch(/Zuschlag.*200/);
  });
  it("erkennt eine fehlende Wurzel und das unzulässige Addieren von Katheten", () => {
    const quadrat = pruefeMathe(aufgabe("pythagoras-2"), "25", "m");
    expect(quadrat).toMatchObject({ richtig: false, kategorie: "rechenweg" });
    expect(quadrat?.hinweis).toContain("Quadratwurzel");
    expect(pruefeMathe(aufgabe("pythagoras-2"), "7", "m")).toMatchObject({ richtig: false, kategorie: "formel" });
  });
  it("erkennt Metern statt Zentimetern und eine nicht umgerechnete Schichtdicke", () => {
    expect(pruefeMathe(aufgabe("gefaelle-1"), "0,12", "cm")).toMatchObject({ richtig: false, kategorie: "einheiten" });
    expect(pruefeMathe(aufgabe("massstab-1"), "0,12", "cm")).toMatchObject({ richtig: false, kategorie: "einheiten" });
    expect(pruefeMathe(aufgabe("volumen-1"), "100", "m³")).toMatchObject({ richtig: false, kategorie: "einheiten" });
  });
});
