import { describe, expect, it } from "vitest";
import { getAufgaben } from "@/lib/content";
import { getLernfelder } from "@/lib/lernfelder";
import { findeBegriffe, getBegriff, getGlossar, sucheBegriffe, teileGlossarText } from "@/lib/glossar";

describe("gemeinsames Glossar", () => {
  it("übernimmt jede vorhandene Fachbegriffskarte mit stabiler ID und nachvollziehbarer Herkunft", () => {
    const karten = getLernfelder().flatMap((lf) => getAufgaben(lf.id)).filter((a) => a.typ === "fachbegriff");
    expect(karten).toHaveLength(100);
    for (const karte of karten) {
      const begriff = getBegriff(karte.id);
      expect(begriff, karte.id).toBeDefined();
      expect(begriff!.quellen).toContain(karte.quelle);
      expect(begriff!.aufgabenIds).toContain(karte.id);
      expect(begriff!.einfach.length).toBeGreaterThan(15);
      expect(begriff!.beispiel.length).toBeGreaterThan(15);
      expect(begriff!.einfach, karte.id).not.toEqual(karte.definition);
    }
    expect(new Set(getGlossar().map((e) => e.id)).size).toBe(getGlossar().length);
  });

  it("führt gleichbedeutende Karten zusammen und erhält beide ursprünglichen Verweise", () => {
    expect(getBegriff("lf05-112")).toBe(getBegriff("lf05-005"));
    expect(getBegriff("lf05-005")?.aliases).toContain("Assimilation");
    expect(getBegriff("glossar-lf07-048")?.begriff).toBe("Freibord");
  });

  it("ergänzt zentrale LF7-Begriffe und findet Umlaute, Aliasse und einfache Erklärungen", () => {
    expect(sucheBegriffe("waermedehnung")[0].begriff).toBe("Wärmedehnung");
    expect(sucheBegriffe("u-wert")[0].begriff).toBe("Wärmedurchgangskoeffizient (U-Wert)");
    expect(sucheBegriffe("Regenspende")[0].begriff).toBe("Berechnungsregenspende");
    expect(sucheBegriffe("zehnmillionenunbekannt")).toEqual([]);
    expect(sucheBegriffe("  ")).toHaveLength(getGlossar().length);
    for (const name of ["Dachablauf", "Kontaktkorrosion", "Notentwässerung", "Abwicklung", "Abflussbeiwert"]) {
      expect(sucheBegriffe(name)[0].begriff).toBe(name);
    }
  });
  it("ergänzt Mathe- und Projektbegriffe mit Erklärung, Baustellenbeispiel und Skizze",()=>{
    for(const wort of["Hypotenuse","Ankathete","Gegenkathete","Sinus","Kosinus","Tangens","Deckmaß","Lattweite","Wärmeleitfähigkeit","Wärmedurchlasswiderstand","Festpunkt","Gleitbereich","Befund","Abdichtung"]){
      const b=sucheBegriffe(wort).find(b=>b.begriff===wort)!;expect(b,wort).toBeDefined();expect(b.einfach.length).toBeGreaterThan(30);expect(b.beispiel.length).toBeGreaterThan(30);expect(b.bild).toBeTruthy();
    }
    expect(getBegriff("anhang2-071")?.bild).toBe("waerme");
    expect(findeBegriffe("Eine Hypotenuse, zwei Deckmaße und ein Festpunkt.").map(b=>b.begriff)).toEqual(["Hypotenuse","Deckmaß","Festpunkt"]);
    expect(getBegriff("glossar-werkstatt-luftschicht")?.id).not.toBe(getBegriff("glossar-werkstatt-hinterlueftung")?.id);
  });
});

describe("Begriffe im Lerntext", () => {
  it("erhält alle Zeichen und erkennt längere Namen vor kürzeren Aliassen", () => {
    const text = "Dachrinne, Rinnenhalter und Berechnungsregenspende: Die Dachrinne ist kein Dachrinnenhalter.";
    const teile = teileGlossarText(text);
    expect(teile.map((t) => t.text).join("")).toBe(text);
    expect(teile.filter((t) => t.art === "begriff").map((t) => t.text)).toEqual(["Dachrinne", "Rinnenhalter", "Berechnungsregenspende", "Dachrinne"]);
    expect(findeBegriffe(text).map((e) => e.begriff)).toEqual(["Dachrinne", "Rinnenhalter", "Berechnungsregenspende"]);
  });

  it("lässt Platzhalter, Code, Formeln und kurze Variablen unberührt", () => {
    const text = "{Freibord} `Dachrinne` \\(Regenspende\\) $$Maßstab$$ $Gefälle$ und Wärmedehnung; r C Wp.";
    const teile = teileGlossarText(text);
    expect(teile.map((t) => t.text).join("")).toBe(text);
    expect(findeBegriffe(text).map((e) => e.begriff)).toEqual(["Wärmedehnung"]);
  });

  it("behandelt Satzzeichen und Großschreibung, aber keine Teilwörter als Treffer", () => {
    expect(findeBegriffe("(FREIBORD), Regenspende. Freibordhöhe und Querschnittsfläche.").map((e) => e.begriff)).toEqual(["Freibord", "Berechnungsregenspende"]);
    expect(teileGlossarText("")).toEqual([]);
  });
});
