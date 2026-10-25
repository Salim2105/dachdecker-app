import { describe, expect, it } from "vitest";
import { STANDORT_FRAGEN } from "@/lib/standortcheck";
import { MATHE_EINHEITEN } from "@/lib/matheGrundlagen";
import { DEUTSCH_EINHEITEN, ENGLISCH_EINHEITEN } from "@/lib/sprachWerkstatt";
import { getCurriculum } from "@/lib/curriculum";
import { aktiverBereich } from "@/lib/navigation";

describe("Übungshinweise führen zu den tatsächlich geübten Lernzielen", () => {
  it.each(STANDORT_FRAGEN)("verknüpft $id mit einer vorhandenen Einheit und derselben Diagnose-ID", (f) => {
    const [pfad, id] = f.route.split("#");
    expect(id, f.id).toBeTruthy();
    if (pfad === "/grundlagen/mathe") {
      expect(MATHE_EINHEITEN.some((e) => e.id === id), f.id).toBe(true);
      expect(f.lernzielId).toBe(id);
    } else if (pfad === "/sprache/deutsch" || pfad === "/sprache/englisch") {
      const sprache = pfad.split("/").at(-1);
      const einheiten = sprache === "deutsch" ? DEUTSCH_EINHEITEN : ENGLISCH_EINHEITEN;
      expect(einheiten.some((e) => e.id === id), f.id).toBe(true);
      expect(f.lernzielId).toBe(`${sprache}-${id}`);
    } else {
      const kurs = getCurriculum(pfad.split("/").at(-1)!);
      expect(kurs?.kapitel.flatMap((k) => k.einheiten).some((e) => e.id === id), f.id).toBe(true);
      expect(f.lernzielId).toBe(id);
    }
  });

  it.each([
    ["/grundlagen/mathe", "/lernen"], ["/sprache/deutsch", "/lernen"], ["/sprache/englisch", "/lernen"],
    ["/lernhilfe", "/ueben"], ["/erprobung", "/ueben"], ["/lernen/lf08/ueben", "/ueben"],
    ["/projekte", "/ueben"], ["/bildtraining", "/ueben"],
    ["/lernen/lf08", "/lernen"], ["/pruefung", "/pruefung"], ["/fortschritt", "/"],
  ])("ordnet %s dem richtigen Hauptbereich %s zu", (route, bereich) => {
    expect(aktiverBereich(route)).toBe(bereich);
  });
});
