import { describe, expect, it } from "vitest";
import { getThemenIndex, normalisiereThemenSuche, sucheThemen, type ThemenArt } from "@/lib/themenSuche";
import { getAufgaben, getLernfelder } from "@/lib/content";
import { getCurriculum } from "@/lib/curriculum";
import { getBegriff } from "@/lib/glossar";
import { getWerkstattEinheit } from "@/lib/werkstattInhalte";
import { dachRoutenZiel } from "@/lib/dach3dVerknuepfungen";
import { getBildAufgabe } from "@/lib/bildtraining";

describe("gemeinsame lokale Themensuche", () => {
  it.each(["Flüssigkunststoff", "Fluessigkunststoff", "FLK", "Flüssigabdichtungen"])("findet für %s die passende Erklärung und sichtbare Kontrollfragen", query => {
    const treffer = sucheThemen(query);
    expect(treffer.slice(0, 3).some(t => t.href === "/lernen/lf10#lf10-l11-e01")).toBe(true);
    expect(treffer.slice(0, 3).some(t => t.href === "/lernen/lf14#lf14-l02-e01")).toBe(true);
    expect(treffer.some(t => t.art === "aufgabe" && t.href.includes("lf10"))).toBe(true);
    expect(treffer[0].art).toBe("erklaerung");
  });
  it("führt Umlaute und gebräuchliche Schreibweisen zusammen, erfindet aber keine Herstellerinhalte", () => {
    expect(normalisiereThemenSuche("Flüssigkunststoffe")).toBe(normalisiereThemenSuche("FLK"));
    expect(sucheThemen("Waerme").map(t => t.id)).toEqual(sucheThemen("Wärme").map(t => t.id));
    expect(sucheThemen("Enke")).toEqual([]);
    expect(sucheThemen("Enkopur")).toEqual([]);
  });
  it("findet eine echte Schneidevorführung und erhält deren konkreten Filmkontext", () => {
    const filme = sucheThemen("Ziegel schneiden", "film");
    expect(filme.some(t => t.href === "/projekte?medium=film#werkstatt-falzziegel-bearbeiten")).toBe(true);
    expect(filme.every(t => t.art === "film")).toBe(true);
    expect(sucheThemen("anzeichnen", "film").some(t => t.href.includes("werkstatt-falzziegel-schnitt"))).toBe(true);
    expect(sucheThemen("Ziegel schneiden").slice(0, 12).some(t => t.href === "/projekte?medium=film#werkstatt-falzziegel-bearbeiten")).toBe(true);
  });
  it("zeigt keine Kunststoffbahn-Einheit allein wegen der gemeinsamen Kapitelüberschrift", () => {
    expect(sucheThemen("FLK").some(t => t.href === "/lernen/lf10#lf10-l10-e01")).toBe(false);
  });
  it.each(["Flüssigkunststoff", "Ziegel schneiden", "Latten einteilen", "Kehle"])("bietet für das angezeigte Beispiel %s passende Inhalte", query => {
    expect(sucheThemen(query).length).toBeGreaterThan(0);
  });
  it("öffnet Fragen nach ihrer stabilen ID innerhalb der zugehörigen Einheit", () => {
    const sichtbar = new Set(getLernfelder().flatMap(lf => getAufgaben(lf.id).map(a => a.id)));
    for (const t of getThemenIndex().filter(t => t.id.startsWith("frage:"))) {
      const url = new URL(t.href, "https://app.test");
      const aufgabe = url.searchParams.get("aufgabe")!;
      const lf = url.pathname.split("/")[2];
      const einheit = getCurriculum(lf)?.kapitel.flatMap(k => k.einheiten).find(e => `#${e.id}` === url.hash);
      expect(sichtbar.has(aufgabe)).toBe(true);
      expect(einheit?.aufgabenIds).toContain(aufgabe);
      expect(url.searchParams.get("schritt")).toBe("kontrollfragen");
    }
  });
  it("liefert gültige direkte Ziele, ohne unbekannte Routen oder leere Medienkarten", () => {
    const eintraege = getThemenIndex();
    expect(new Set(eintraege.map(t => t.id)).size).toBe(eintraege.length);
    expect(new Set(eintraege.map(t => t.art))).toEqual(new Set<ThemenArt>(["erklaerung", "aufgabe", "begriff", "mathe", "sprache", "bild", "handwerk", "dach", "film", "projekt"]));
    for (const t of eintraege) {
      const url = new URL(t.href, "https://app.test");
      expect(url.origin).toBe("https://app.test");
      expect(t.titel.length).toBeGreaterThan(0);
      if (t.art === "begriff") expect(getBegriff(decodeURIComponent(url.hash.slice(1)))).toBeDefined();
      if (t.art === "handwerk") expect(getWerkstattEinheit(url.hash.slice(1))).toBeDefined();
      if (t.art === "bild") expect(getBildAufgabe(url.hash.slice(1))).toBeDefined();
      if (t.art === "dach") expect(dachRoutenZiel(url.hash.slice(1))).not.toBeNull();
      if (t.id.startsWith("fragenpool:")) expect(getAufgaben(url.pathname.split("/")[2]).some(a => a.thema === url.searchParams.get("thema"))).toBe(true);
    }
  });
  it("behandelt leere, kurze und unbekannte Anfragen ohne Zufallstreffer", () => {
    expect(sucheThemen("")).toEqual([]);
    expect(sucheThemen("x")).toEqual([]);
    expect(sucheThemen("qqqxyzunbekannt")).toEqual([]);
    expect(sucheThemen("Dach")).toEqual(sucheThemen("Dach"));
  });
});
