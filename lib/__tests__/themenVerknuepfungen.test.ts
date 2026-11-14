import { describe, expect, it } from "vitest";
import { getCurriculum } from "@/lib/curriculum";
import { neuerKursStand } from "@/lib/kursStand";
import { getWerkstattEinheit } from "@/lib/werkstattInhalte";
import { dachRoutenZiel } from "@/lib/dach3dVerknuepfungen";
import { filmGewuenscht, kontrollfragenEinstieg, kursFortsetzungsRoute, themenAngeboteFuer } from "@/lib/themenVerknuepfungen";

describe("Passende Angebote zu einer Lerneinheit", () => {
  it("verbindet die beiden Flüssigabdichtungserklärungen ohne erfundenen Herstellerfilm", () => {
    const angebote = themenAngeboteFuer({ id: "lf10-l11-e01", lektionIds: ["lf10-l11"] });
    expect(angebote).toEqual([expect.objectContaining({ art: "Erklärung", href: "/lernen/lf14#lf14-l02-e01" })]);
    expect(angebote.some(a => a.art === "Film")).toBe(false);
    expect(themenAngeboteFuer({ id: "lf14-l02-e01", lektionIds: ["lf14-l02"] })).toContainEqual(expect.objectContaining({ href: "/lernen/lf10#lf10-l11-e01" }));
  });
  it("führt von Falzziegeltheorie zu vorhandenen Handgriffen und veröffentlichten Filmen", () => {
    const a = themenAngeboteFuer({ id: "lf08-l20-e01", lektionIds: ["lf08-l20"] });
    expect(a).toContainEqual(expect.objectContaining({ art: "Handwerk", href: "/projekte#werkstatt-falzziegel-schnitt" }));
    expect(a).toContainEqual(expect.objectContaining({ art: "Film", href: "/projekte?medium=film#werkstatt-falzziegel-bearbeiten" }));
    expect(a.some(x => x.href.includes("biber"))).toBe(false);
  });
  it("verwendet nur existierende Ziele, hält die Dachform und zeigt keine doppelten Angebote", () => {
    for (const lf of ["lf02", "lf07", "lf08", "lf10", "lf14"]) {
      for (const e of getCurriculum(lf)!.kapitel.flatMap(k => k.einheiten)) {
        const a = themenAngeboteFuer(e);
        expect(new Set(a.map(a => `${a.art}:${a.id}`)).size).toBe(a.length);
        for (const ziel of a) {
          const url = new URL(ziel.href, "https://lernwerkstatt.test");
          const id = url.hash.slice(1);
          if (url.pathname.startsWith("/lernen/")) expect(getCurriculum(url.pathname.split("/")[2])!.kapitel.flatMap(k => k.einheiten).some(e => e.id === id)).toBe(true);
          else expect(getWerkstattEinheit(id) || dachRoutenZiel(id)).toBeTruthy();
        }
      }
    }
  });
});

describe("Direkter Einstieg in vorhandene Kontrollfragen", () => {
  const e = getCurriculum("lf10")!.kapitel.flatMap(k => k.einheiten).find(e => e.id === "lf10-l11-e01")!;
  it("öffnet die genaue Frage, ohne Erklärung, Antworten oder Kursphase zu ersetzen", () => {
    const vorher = { ...neuerKursStand(e), notiz: "Meine angefangene Erklärung", kontrolleIndex: 0 };
    const neu = kontrollfragenEinstieg(e, vorher, `?schritt=kontrollfragen&aufgabe=${e.aufgabenIds[1]}`);
    expect(neu).toEqual({ ...vorher, kontrollfragenDirekt: true, kontrolleIndex: 1 });
    expect(neu.selbstbewertung).toBeUndefined(); expect(neu.abgeschlossen).toBe(false); expect(neu.phase).toBe(0);
  });
  it("ignoriert fremde Fragen und ändert ohne ausdrücklichen Übungsaufruf nichts", () => {
    const vorher = { ...neuerKursStand(e), kontrolleIndex: 1 };
    expect(kontrollfragenEinstieg(e, vorher, "?aufgabe=fremd")).toBe(vorher);
    expect(kontrollfragenEinstieg(e, vorher, "?schritt=kontrollfragen&aufgabe=fremd").kontrolleIndex).toBe(1);
    expect(kursFortsetzungsRoute("lf10", e.id, true)).toBe(`/lernen/lf10?schritt=kontrollfragen#${e.id}`);
    expect(filmGewuenscht("?medium=film&deckung=warmdach")).toBe(true);
    expect(filmGewuenscht("?medium=video")).toBe(false);
  });
});
