import { describe, it, expect } from "vitest";
import anzahl from "@/content/anzahl.json";
import { getLernfelder, getAufgaben } from "@/lib/content";

// content/anzahl.json wird generiert (scripts/gen-anzahl.mjs) und von der
// Startseite benutzt, damit sie die Aufgaben nicht laden muss. Genau darin
// liegt die Gefahr: Kommen Aufgaben dazu und niemand generiert neu, rechnet
// die Prüfungsreife stillschweigend gegen eine veraltete Gesamtzahl. Dieser
// Test ist die einzige Stelle, die den Abgleich erzwingt.
describe("anzahl.json", () => {
  it("stimmt mit dem tatsächlichen Aufgabenbestand überein", () => {
    let gesamt = 0;
    const abweichungen: string[] = [];

    for (const lf of getLernfelder()) {
      const echt = getAufgaben(lf.id).length;
      const notiert = (anzahl.proLernfeld as Record<string, number>)[lf.id];
      if (notiert !== echt) abweichungen.push(`${lf.id}: notiert ${notiert}, tatsächlich ${echt}`);
      gesamt += echt;
    }

    expect(abweichungen, "npm run build erzeugt anzahl.json neu (prebuild)").toEqual([]);
    expect(anzahl.gesamt).toBe(gesamt);
  });
});
