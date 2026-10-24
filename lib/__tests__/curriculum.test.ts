import { describe, expect, it } from "vitest";
import { getCurriculum, teileLerntext } from "@/lib/curriculum";
import { getAufgaben, getLektionen, getLernfelder } from "@/lib/content";
import { bewerteAktivitaet, starteAktivitaet } from "@/lib/aktivitaeten";

describe("Kapitel und stabile Aufgabenverknüpfungen", () => {
  it("enthält 18 vollständige LF7-Einheiten mit allen vier Aktivitätsformen", () => {
    const kurs = getCurriculum("lf07")!;
    expect(kurs.kapitel).toHaveLength(6);
    const einheiten = kurs.kapitel.flatMap((k) => k.einheiten);
    expect(einheiten).toHaveLength(18);
    expect(new Set(einheiten.map((e) => e.id)).size).toBe(18);
    expect(new Set(einheiten.map((e) => e.aktivitaet!.typ))).toEqual(new Set(["zuordnen", "reihenfolge", "skizzenfehler", "baustellenfall"]));
    const fragen = new Set(getAufgaben("lf07").map((a) => a.id));
    const lektionen = new Set(getLektionen("lf07").map((l) => l.id));
    for (const e of einheiten) {
      expect(e.lernziel.length).toBeGreaterThan(30);
      expect(e.minuten).toBeGreaterThanOrEqual(5); expect(e.minuten).toBeLessThanOrEqual(10);
      expect(e.aufgabenIds.length).toBeGreaterThanOrEqual(2); expect(e.aufgabenIds.length).toBeLessThanOrEqual(4);
      expect(e.aufgabenIds.every((id) => fragen.has(id))).toBe(true);
      expect(e.lektionIds.every((id) => lektionen.has(id))).toBe(true);
      for (const text of e.textschritte) { const n = text.trim().split(/\s+/).length; expect(n).toBeGreaterThanOrEqual(80); expect(n).toBeLessThanOrEqual(150); }
      expect(e.illustration).toBeDefined();
    }
  });
  it("behält sämtliche sichtbaren Lektionen in den übrigen Lernfeldern mit gültigen Aufgaben-IDs", () => {
    for (const lf of getLernfelder()) {
      const kurs = getCurriculum(lf.id)!;
      const einheiten = kurs.kapitel.flatMap((k) => k.einheiten);
      const aufgaben = new Set(getAufgaben(lf.id).map((a) => a.id));
      for (const l of getLektionen(lf.id)) expect(einheiten.some((e) => e.lektionIds.includes(l.id)), l.id).toBe(true);
      for (const e of einheiten) { expect(e.aufgabenIds.length, e.id).toBeGreaterThanOrEqual(2); expect(e.aufgabenIds.every((id) => aufgaben.has(id)), e.id).toBe(true); }
    }
  });
  it("teilt auch sehr lange Absätze ohne Textverlust", () => {
    const original = Array.from({length: 401}, (_, n) => `Wort${n}`).join(" ");
    const texte = teileLerntext([original]);
    expect(texte.join(" ")).toBe(original); expect(texte.every((t) => t.split(" ").length <= 150)).toBe(true);
  });
  it("bewertet Zuordnung, Reihenfolge und Mehrfachauswahl ohne Alles-Ankreuzen-Bonus", () => {
    for (const e of getCurriculum("lf07")!.kapitel.flatMap((k) => k.einheiten)) {
      const a = e.aktivitaet!; const antwort = starteAktivitaet(a);
      if (a.typ === "zuordnen") antwort.zuordnung = Object.fromEntries(a.paare.map((p) => [p.id, p.id]));
      else if (a.typ === "reihenfolge") antwort.reihenfolge = a.schritte.map((s) => s.id);
      else antwort.auswahl = a.optionen.filter((o) => o.korrekt).map((o) => o.id);
      expect(bewerteAktivitaet(a, antwort).richtig).toBe(true);
      if (a.typ === "baustellenfall" || a.typ === "skizzenfehler") expect(bewerteAktivitaet(a, { ...antwort, auswahl: a.optionen.map((o) => o.id) }).richtig).toBe(false);
    }
  });
});
