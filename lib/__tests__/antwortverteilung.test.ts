import { describe, it, expect } from "vitest";
import { getLernfelder, getAufgaben } from "@/lib/content";
import type { McAufgabe } from "@/content/schema";

// Vor dem Mischen stand die richtige Antwort in 82,9 % der Einfachauswahl-
// Aufgaben auf Index 0 — in fünfzehn von neunzehn Einheiten in AUSNAHMSLOS
// jeder. Bei Mehrfachauswahl war die Lösung zu 98,1 % ein Präfix ab 0.
//
// Wer nichts weiß und immer oben ankreuzt, kam damit auf 83 %, und die
// Prüfungsreife zählte das als Wissen. Diese Tests sind der Grund, warum das
// nicht zurückkommt: Neue Aufgaben werden von Hand geschrieben, und von Hand
// schreibt man die richtige Antwort zuerst.
const alle = getLernfelder().flatMap((lf) => getAufgaben(lf.id));
const mc = alle.filter((a): a is McAufgabe => a.typ === "mc");
const einfach = mc.filter((a) => a.korrekt.length === 1);
const mehrfach = mc.filter((a) => a.korrekt.length > 1);

describe("Antwortverteilung", () => {
  it("verteilt die richtige Antwort über alle Positionen", () => {
    const zaehler = [0, 0, 0, 0, 0, 0];
    for (const a of einfach) zaehler[a.korrekt[0]]++;

    // 25 % wäre ideal bei vier Optionen. 40 % lässt Spielraum für die 28
    // Aufgaben, deren Erklärung auf eine Position verweist und die deshalb
    // nicht gemischt werden dürfen.
    const groesster = Math.max(...zaehler) / einfach.length;
    expect(groesster, `häufigster Index bei ${(groesster * 100).toFixed(1)} %`).toBeLessThan(0.4);
  });

  it("macht die Lösung bei Mehrfachauswahl nicht zum Präfix", () => {
    const praefix = mehrfach.filter((a) => {
      const s = [...a.korrekt].sort((x, y) => x - y);
      return s.every((v, i) => v === i);
    });
    const anteil = praefix.length / mehrfach.length;
    expect(anteil, `${(anteil * 100).toFixed(1)} % Präfix-Lösungen`).toBeLessThan(0.4);
  });

  it("hält auch einzelne Lernfelder unter der Schwelle", () => {
    // Ohne diesen Test könnte ein neu gebautes Lernfeld komplett schief sein,
    // ohne dass der Gesamtwert es zeigt — genau so ist der Fehler entstanden.
    for (const lf of getLernfelder()) {
      const f = getAufgaben(lf.id).filter(
        (a): a is McAufgabe => a.typ === "mc" && a.korrekt.length === 1,
      );
      if (f.length < 20) continue; // zu klein für Statistik
      const zaehler = [0, 0, 0, 0, 0, 0];
      for (const a of f) zaehler[a.korrekt[0]]++;
      const groesster = Math.max(...zaehler) / f.length;
      expect(groesster, `${lf.id}: häufigster Index bei ${(groesster * 100).toFixed(0)} %`).toBeLessThan(0.55);
    }
  });
});
