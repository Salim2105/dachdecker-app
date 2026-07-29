#!/usr/bin/env node
/**
 * Repariert durchgerutschte Umlaut-Ersatzschreibungen ("Waerme" → "Wärme").
 *
 * Die Artefakte stammen aus Shell- und Tooling-Zwischenschritten beim Aufbau
 * der Inhalte. Sie stehen dort, wo der Nutzer sie sieht: vor allem in den
 * Lückentexten und Aufgabentexten.
 *
 * Das Heikle daran ist, dass "ae", "oe", "ue" auch in völlig korrekten Wörtern
 * vorkommen — Quelle, neue, Feuer, Dauer, Bauer. Eine Ersetzung per Regex
 * würde die kaputt machen.
 *
 * Deshalb entscheidet nicht eine Wortliste, sondern DER BESTAND SELBST: Ein
 * Wort gilt nur dann als Artefakt, wenn dieselbe Schreibweise mit Umlaut
 * anderswo in den 2039 Aufgaben tatsächlich vorkommt. "Waerme" wird ersetzt,
 * weil "Wärme" belegt ist. "Quelle" bleibt, weil "Qüelle" nirgends steht.
 *
 * Was dabei keinen Partner findet, wird gemeldet statt geraten.
 */
import fs from "node:fs";
import path from "node:path";

const WURZEL = path.join(import.meta.dirname, "..", "content");
/** Felder, die der Nutzer zu sehen bekommt. */
const FELDER = ["frage", "text", "aufgabentext", "begriff", "definition", "erklaerung", "optionen", "schritte"];

const dateien = [];
for (const d of fs.readdirSync(WURZEL, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  const f = path.join(WURZEL, d.name, "aufgaben.json");
  if (fs.existsSync(f)) dateien.push(f);
}

const roh = dateien.map((f) => ({ f, aufgaben: JSON.parse(fs.readFileSync(f, "utf8")) }));

/** Alle Wörter einsammeln, die echte Umlaute tragen — das ist der Beleg. */
const mitUmlaut = new Set();
const texteVon = (a) =>
  FELDER.flatMap((k) => (Array.isArray(a[k]) ? a[k] : [a[k]])).filter((v) => typeof v === "string");

for (const { aufgaben } of roh)
  for (const a of aufgaben)
    for (const t of texteVon(a))
      for (const w of t.match(/[\p{L}]+/gu) ?? []) if (/[äöüÄÖÜ]/.test(w)) mitUmlaut.add(w);

const ersetze = (w) =>
  w.replace(/Ae/g, "Ä").replace(/Oe/g, "Ö").replace(/Ue/g, "Ü")
   .replace(/ae/g, "ä").replace(/oe/g, "ö").replace(/ue/g, "ü");

const ersetzt = new Map();
const ungeklaert = new Map();

function repariere(text) {
  return text.replace(/[\p{L}]+/gu, (w) => {
    if (!/ae|oe|ue|Ae|Oe|Ue/.test(w)) return w;
    const kandidat = ersetze(w);
    if (kandidat === w) return w;
    if (mitUmlaut.has(kandidat)) {
      ersetzt.set(`${w} → ${kandidat}`, (ersetzt.get(`${w} → ${kandidat}`) ?? 0) + 1);
      return kandidat;
    }
    ungeklaert.set(w, (ungeklaert.get(w) ?? 0) + 1);
    return w;
  });
}

for (const { f, aufgaben } of roh) {
  let geaendert = false;
  for (const a of aufgaben)
    for (const k of FELDER) {
      if (typeof a[k] === "string") {
        const neu = repariere(a[k]);
        if (neu !== a[k]) ((a[k] = neu), (geaendert = true));
      } else if (Array.isArray(a[k])) {
        a[k] = a[k].map((v) => {
          if (typeof v !== "string") return v;
          const neu = repariere(v);
          if (neu !== v) geaendert = true;
          return neu;
        });
      }
    }
  if (geaendert) fs.writeFileSync(f, JSON.stringify(aufgaben, null, 2));
}

const summe = [...ersetzt.values()].reduce((a, b) => a + b, 0);
console.log(`belegte Umlaut-Wörter im Bestand: ${mitUmlaut.size}`);
console.log(`ersetzt: ${summe} Vorkommen in ${ersetzt.size} verschiedenen Wörtern`);
[...ersetzt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([w, n]) => console.log(`   ${String(n).padStart(3)}×  ${w}`));

console.log(`\nohne Beleg gelassen: ${ungeklaert.size} verschiedene Wörter`);
[...ungeklaert.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([w, n]) => console.log(`   ${String(n).padStart(3)}×  ${w}`));
