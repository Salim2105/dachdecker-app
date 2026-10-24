import { describe, expect, it } from "vitest";
import { GRUNDSTUFE_KURSE } from "@/content/lernwerkstatt/grundstufe";
import { ANHANG_KURSE } from "@/content/lernwerkstatt/anhang";
import { getAufgabe, getLektionen } from "@/lib/content";
import { bewerteAktivitaet, starteAktivitaet } from "@/lib/aktivitaeten";

const kurse = { ...GRUNDSTUFE_KURSE, ...ANHANG_KURSE };
describe("Redigierte Grundstufe, Anhänge und WiSo", () => {
  it("deckt alle sichtbaren Quellenlektionen mit kurzen Einheiten und ausdrücklichen Kontrollaufgaben ab", () => {
    expect(Object.keys(kurse)).toHaveLength(10);
    const ids = new Set<string>();
    for (const [lfId, kapitel] of Object.entries(kurse)) {
      const einheiten = kapitel.flatMap((k) => k.einheiten);
      const quellen = new Set(getLektionen(lfId).map((l) => l.id));
      for (const quelle of quellen) expect(einheiten.some((e) => e.lektionIds.includes(quelle)), quelle).toBe(true);
      for (const e of einheiten) {
        expect(ids.has(e.id), `Doppelte ID ${e.id}`).toBe(false); ids.add(e.id);
        expect(e.version, e.id).toBe(2);
        expect(e.lektionIds.every((id) => quellen.has(id)), e.id).toBe(true);
        expect(e.aufgabenIds.length, e.id).toBeGreaterThanOrEqual(2);
        expect(e.aufgabenIds.length, e.id).toBeLessThanOrEqual(4);
        expect(new Set(e.aufgabenIds).size, e.id).toBe(e.aufgabenIds.length);
        for (const id of e.aufgabenIds) expect(getAufgabe(id), `${e.id}: ${id}`).toBeDefined();
        for (const text of e.textschritte) {
          const woerter = text.trim().split(/\s+/).length;
          expect(woerter, `${e.id}: ${woerter} Wörter`).toBeGreaterThanOrEqual(80);
          expect(woerter, `${e.id}: ${woerter} Wörter`).toBeLessThanOrEqual(150);
        }
        expect(e.lernziel.length, e.id).toBeGreaterThan(30);
        expect(e.abrufFrage.length, e.id).toBeGreaterThan(20);
        expect(e.abrufMuster.length, e.id).toBeGreaterThan(30);
        expect(e.aktivitaet, e.id).toBeDefined();
      }
    }
  });
  it("hat sinnvolle vollständige Aktivitäten mit eindeutigen Lösungen", () => {
    const typen = new Set<string>();
    for (const e of Object.values(kurse).flatMap((k) => k.flatMap((c) => c.einheiten))) {
      const a = e.aktivitaet!; typen.add(a.typ);
      expect(a.id).toBe(`${e.id}-aktiv`);
      const antwort = starteAktivitaet(a);
      if (a.typ === "zuordnen") antwort.zuordnung = Object.fromEntries(a.paare.map((p) => [p.id, p.id]));
      else if (a.typ === "reihenfolge") antwort.reihenfolge = a.schritte.map((s) => s.id);
      else antwort.auswahl = a.optionen.filter((o) => o.korrekt).map((o) => o.id);
      expect(bewerteAktivitaet(a, antwort).richtig, e.id).toBe(true);
      if (a.typ === "baustellenfall" || a.typ === "skizzenfehler") {
        expect(a.optionen.some((o) => !o.korrekt), e.id).toBe(true);
        expect(bewerteAktivitaet(a, { ...antwort, auswahl: a.optionen.map((o) => o.id) }).richtig, e.id).toBe(false);
      }
    }
    expect(typen).toEqual(new Set(["zuordnen", "reihenfolge", "baustellenfall", "skizzenfehler"]));
  });
});
