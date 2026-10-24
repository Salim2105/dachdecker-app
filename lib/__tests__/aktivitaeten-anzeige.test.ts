import { describe, expect, it } from "vitest";
import { DETAIL_KURSE } from "@/content/lernwerkstatt/details";
import { getCurriculum } from "@/lib/curriculum";
import { getLernfelder } from "@/lib/content";
import { bewerteAktivitaet, mischeAnzeige, starteAktivitaet } from "@/lib/aktivitaeten";

const detailFaelle = Object.values(DETAIL_KURSE).flatMap((k) => k.flatMap((c) => c.einheiten))
  .flatMap((e) => e.aktivitaet && (e.aktivitaet.typ === "baustellenfall" || e.aktivitaet.typ === "skizzenfehler") &&
    e.aktivitaet.optionen.length === 2 && e.aktivitaet.optionen.filter((o) => o.korrekt).length === 1 ? [e.aktivitaet] : []);
const positionen = [0, 0];
for (const a of detailFaelle) positionen[mischeAnzeige(a.optionen, `${a.id}:auswahl`).findIndex((o) => o.korrekt)]++;

describe("Aktivitäten ohne verräterische Antwortposition", () => {
  it(`verteilt richtige Einzelaussagen der Detailkurse auf beide Plätze (${positionen.join(" / ")})`, () => {
    expect(detailFaelle.length).toBeGreaterThan(30);
    expect(positionen.every((n) => n > 0)).toBe(true);
    expect(Math.max(...positionen) / detailFaelle.length).toBeLessThan(0.65);
  });
  it("mischt deterministisch ohne Mutation oder Verlust der ursprünglichen IDs und Objekte", () => {
    const original = Object.freeze([Object.freeze({ id: "a" }), Object.freeze({ id: "b" }), Object.freeze({ id: "c" }), Object.freeze({ id: "d" })]);
    const erste = mischeAnzeige(original, "lf07-l01-e01-aktiv");
    expect(erste).toEqual(mischeAnzeige(original, "lf07-l01-e01-aktiv"));
    expect(erste).not.toBe(original);
    expect(new Set(erste)).toEqual(new Set(original));
    expect(original.map((o) => o.id)).toEqual(["a", "b", "c", "d"]);
    const varianten = new Set(Array.from({ length: 25 }, (_, i) => mischeAnzeige(original, `lf${i}-aktiv`).map((o) => o.id).join("-")));
    expect(varianten.size).toBeGreaterThan(3);
    expect(mischeAnzeige([], "leer")).toEqual([]);
    expect(mischeAnzeige(["a"], "einzeln")).toEqual(["a"]);
  });
  it("beginnt echte Reihenfolgeaufgaben nie gelöst und bewahrt die redaktionelle Lösung", () => {
    let anzahl = 0; let nichtNurUmgekehrt = 0;
    for (const lf of getLernfelder()) {
      for (const e of getCurriculum(lf.id)!.kapitel.flatMap((k) => k.einheiten)) {
        const a = e.aktivitaet;
        if (a?.typ !== "reihenfolge") continue;
        anzahl++;
        const richtig = a.schritte.map((s) => s.id);
        const vorher = JSON.stringify(a);
        const start = starteAktivitaet(a);
        expect(start).toEqual(starteAktivitaet(a));
        expect(new Set(start.reihenfolge)).toEqual(new Set(richtig));
        expect(start.reihenfolge, a.id).not.toEqual(richtig);
        if (start.reihenfolge.join(",") !== [...richtig].reverse().join(",")) nichtNurUmgekehrt++;
        expect(bewerteAktivitaet(a, start).richtig, a.id).toBe(false);
        expect(bewerteAktivitaet(a, { ...start, reihenfolge: richtig }).richtig, a.id).toBe(true);
        expect(JSON.stringify(a)).toBe(vorher);
      }
    }
    expect(anzahl).toBeGreaterThan(20);
    expect(nichtNurUmgekehrt).toBeGreaterThan(anzahl / 2);
  });
  it("ändert trotz gemischter Anzeige nicht, welche gespeicherten Aussagen richtig sind", () => {
    for (const a of detailFaelle) {
      const anzeige = mischeAnzeige(a.optionen, `${a.id}:auswahl`);
      const auswahl = anzeige.filter((o) => o.korrekt).map((o) => o.id);
      expect(bewerteAktivitaet(a, { ...starteAktivitaet(a), auswahl }).richtig).toBe(true);
      expect(bewerteAktivitaet(a, { ...starteAktivitaet(a), auswahl: anzeige.map((o) => o.id) }).richtig).toBe(false);
    }
  });
});
