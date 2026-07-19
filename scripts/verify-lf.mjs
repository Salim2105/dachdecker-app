// Prüft ein Lernfeld: JSON-Struktur, Pflichtfelder, Aufgabentypen — und rendert
// die enthaltenen SVGs als PNG zur Sichtprüfung (dunkles Theme simuliert).
// Aufruf: node scripts/verify-lf.mjs lf03 [ausgabeordner]
import sharp from "sharp";
import { readFileSync } from "node:fs";

const lf = process.argv[2];
const OUT = process.argv[3] ?? ".";
if (!lf) {
  console.error("Usage: node scripts/verify-lf.mjs <lfId> [outDir]");
  process.exit(1);
}

const aufgaben = JSON.parse(readFileSync(`./content/${lf}/aufgaben.json`, "utf8"));
const lektionen = JSON.parse(readFileSync(`./content/${lf}/lektionen.json`, "utf8"));

const PFLICHT = ["id", "typ", "lernfeld", "thema", "quelle", "konfidenz", "erklaerung"];
let fehler = 0;
const ids = new Set();

for (const a of aufgaben) {
  for (const f of PFLICHT) {
    if (a[f] === undefined) {
      console.error(`FEHLT: ${a.id ?? "?"} -> ${f}`);
      fehler++;
    }
  }
  if (ids.has(a.id)) {
    console.error(`DOPPELTE ID: ${a.id}`);
    fehler++;
  }
  ids.add(a.id);
  if (a.lernfeld !== lf) {
    console.error(`FALSCHES LERNFELD: ${a.id} -> ${a.lernfeld}`);
    fehler++;
  }
  if (a.typ === "mc") {
    if (!a.korrekt?.length) {
      console.error(`MC OHNE KORREKT: ${a.id}`);
      fehler++;
    }
    for (const k of a.korrekt ?? []) {
      if (k < 0 || k >= a.optionen.length) {
        console.error(`MC INDEX AUSSERHALB: ${a.id} -> ${k}`);
        fehler++;
      }
    }
  }
  if (a.typ === "diagram") {
    for (const key of Object.keys(a.zuordnung ?? {})) {
      if (!a.zuordnung[key]) {
        console.error(`DIAGRAM LEERE ZUORDNUNG: ${a.id} -> ${key}`);
        fehler++;
      }
    }
  }
  if (a.typ === "cloze") {
    const gaps = [...a.text.matchAll(/\{\{(.+?)\}\}/g)].map((m) => m[1]);
    if (gaps.length === 0) {
      console.error(`CLOZE OHNE LUECKE: ${a.id}`);
      fehler++;
    }
  }
  if (a.typ === "calc") {
    const namen = a.parameter.map((p) => p.name);
    for (const p of a.parameter) {
      if (p.min > p.max) {
        console.error(`CALC MIN>MAX: ${a.id} -> ${p.name}`);
        fehler++;
      }
    }
    for (const s of a.schritte) {
      for (const token of s.formel.match(/[a-zA-Z_]\w*/g) ?? []) {
        const bekannt = namen.includes(token) || a.schritte.some((x) => x.ergebnisName === token);
        if (!bekannt) {
          console.error(`CALC UNBEKANNTE VARIABLE: ${a.id} -> ${token}`);
          fehler++;
        }
      }
    }
  }
}

for (const l of lektionen) {
  for (const f of ["id", "lernfeld", "thema", "titel", "inhalt", "quelle", "konfidenz"]) {
    if (l[f] === undefined) {
      console.error(`LEKTION FEHLT: ${l.id ?? "?"} -> ${f}`);
      fehler++;
    }
  }
}

const typen = [...new Set(aufgaben.map((a) => a.typ))];
console.log(`${lf}: ${aufgaben.length} Aufgaben, ${lektionen.length} Lektionen`);
console.log(`Typen: ${typen.join(", ")}`);
console.log(`Konfidenz: ${[...new Set([...aufgaben, ...lektionen].map((x) => x.konfidenz))].join(", ")}`);

// SVGs rendern
const svgs = [];
for (const a of aufgaben) {
  if (a.svg) svgs.push([`${a.id}-diagram`, a.svg]);
  if (a.loesungSvg) svgs.push([`${a.id}-loesung`, a.loesungSvg]);
}
for (const l of lektionen) if (l.svg) svgs.push([`${l.id}-lektion`, l.svg]);

for (const [name, svg] of svgs) {
  const inner = svg
    .replace(/currentColor/g, "#ece7df")
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
  const m = svg.match(/viewBox='0 0 (\d+) (\d+)'/);
  const w = m ? Number(m[1]) : 320;
  const h = m ? Number(m[2]) : 200;
  const wrapped = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='${w}' height='${h}' fill='#23262b'/>${inner}</svg>`;
  await sharp(Buffer.from(wrapped)).png().toFile(`${OUT}/${name}.png`);
  console.log("SVG gerendert:", name);
}

if (fehler > 0) {
  console.error(`\n${fehler} Fehler gefunden.`);
  process.exit(1);
}
console.log("\nAlles in Ordnung.");
