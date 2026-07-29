#!/usr/bin/env node
/**
 * Mischt die Antwortoptionen aller Multiple-Choice-Aufgaben.
 *
 * Warum das nötig war: Gemessen über alle 1045 Einfachauswahl-Aufgaben stand
 * die richtige Antwort in 82,9 % der Fälle auf Index 0 — in fünfzehn von
 * neunzehn Einheiten sogar in AUSNAHMSLOS jeder Aufgabe. Bei Mehrfachauswahl
 * war die Lösung in 98,1 % ein Präfix ab 0. Wer nichts weiß und immer oben
 * ankreuzt, kam damit auf 83 % — und die Prüfungsreife zählte das als Wissen.
 * Das ist derselbe Goodhart-Kanal, den lib/serie.ts sorgfältig ausschließt,
 * nur im Inhalt statt im Code.
 *
 * Deterministisch: Der Zufall wird aus der Aufgaben-ID gezogen. Zweimal laufen
 * lassen ändert nichts, und die Diffs bleiben zwischen Läufen stabil.
 *
 * Ausgenommen: Aufgaben, deren Erklärung auf eine POSITION verweist ("Option 3",
 * "die oberste", "D)"). Sie zu mischen würde die Erklärung auf die falsche
 * Antwort zeigen lassen. Sie werden gemeldet und müssen inhaltlich umformuliert
 * werden, bevor sie mitgemischt werden können.
 */
import fs from "node:fs";
import path from "node:path";

const WURZEL = path.join(import.meta.dirname, "..", "content");
const POSITIONSVERWEIS =
  /\b(erste|zweite|dritte|vierte|letzte)\s+(Antwort|Option|Auswahl|Möglichkeit)|Antwort\s+[A-D]\b|Option\s+[1-4]\b|\b[A-D]\)\s|oben\s+stehende|unterste|oberste/i;

/** xmur3 + mulberry32 — kleiner, gleichverteilter PRNG aus einem String-Seed. */
function prng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = (h ^= h >>> 16) >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const zaehler = { gemischt: 0, uebersprungen: 0, unveraendert: 0 };
const ausgenommen = [];

for (const d of fs.readdirSync(WURZEL, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  const datei = path.join(WURZEL, d.name, "aufgaben.json");
  if (!fs.existsSync(datei)) continue;
  const aufgaben = JSON.parse(fs.readFileSync(datei, "utf8"));
  let geaendert = false;

  for (const a of aufgaben) {
    if (a.typ !== "mc" || !Array.isArray(a.optionen) || a.optionen.length < 2) continue;

    if (POSITIONSVERWEIS.test(a.erklaerung ?? "") || POSITIONSVERWEIS.test(a.frage ?? "")) {
      zaehler.uebersprungen++;
      ausgenommen.push(a.id);
      continue;
    }

    // Fisher-Yates über die Indizes, damit `korrekt` sauber mitwandert.
    const rnd = prng(a.id);
    const reihenfolge = a.optionen.map((_, i) => i);
    for (let i = reihenfolge.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [reihenfolge[i], reihenfolge[j]] = [reihenfolge[j], reihenfolge[i]];
    }

    const neueOptionen = reihenfolge.map((alt) => a.optionen[alt]);
    // reihenfolge[neu] = alt  →  für korrekt brauchen wir alt → neu.
    const altZuNeu = new Map(reihenfolge.map((alt, neu) => [alt, neu]));
    const neuKorrekt = a.korrekt.map((k) => altZuNeu.get(k)).sort((x, y) => x - y);

    if (neueOptionen.every((o, i) => o === a.optionen[i])) {
      zaehler.unveraendert++;
    } else {
      zaehler.gemischt++;
      geaendert = true;
    }
    a.optionen = neueOptionen;
    a.korrekt = neuKorrekt;
  }

  if (geaendert) fs.writeFileSync(datei, JSON.stringify(aufgaben, null, 2));
}

console.log(`gemischt: ${zaehler.gemischt}`);
console.log(`zufällig unverändert geblieben: ${zaehler.unveraendert}`);
console.log(`wegen Positionsverweis übersprungen: ${zaehler.uebersprungen}`);
if (ausgenommen.length) console.log(`  ${ausgenommen.join(", ")}`);
